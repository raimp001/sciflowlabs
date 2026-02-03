import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const resolveDisputeSchema = z.object({
  resolution: z.enum(['funder_wins', 'lab_wins', 'partial_refund']),
  arbitrator_notes: z.string().max(5000).optional(),
  slash_percentage: z.number().min(0).max(100).optional(),
  refund_percentage: z.number().min(0).max(100).optional(),
})

/**
 * POST /api/disputes/[id]/resolve - Resolve a dispute (admin/arbitrator only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (dbUser?.role !== 'admin' && dbUser?.role !== 'arbitrator') {
      return NextResponse.json({ error: 'Only admins and arbitrators can resolve disputes' }, { status: 403 })
    }

    // Parse and validate body
    const body = await request.json()
    const validationResult = resolveDisputeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { resolution, arbitrator_notes, slash_percentage, refund_percentage } = validationResult.data

    // Get dispute with bounty info
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .select(`
        *,
        bounty:bounties!disputes_bounty_id_fkey(
          id, title, funder_id, selected_lab_id, total_budget,
          selected_lab:labs!bounties_selected_lab_id_fkey(id, user_id, staking_balance, locked_stake),
          escrow:escrows(*)
        )
      `)
      .eq('id', id)
      .single()

    if (disputeError || !dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    // Verify dispute is open
    if (dispute.status === 'resolved') {
      return NextResponse.json({ error: 'Dispute already resolved' }, { status: 400 })
    }

    // Calculate slash amount if lab loses
    let slashAmount = 0
    if (resolution === 'funder_wins' && dispute.bounty.selected_lab && slash_percentage) {
      const lockedStake = parseFloat(dispute.bounty.selected_lab.locked_stake) || 0
      slashAmount = lockedStake * (slash_percentage / 100)
    }

    // Update dispute
    const { error: updateError } = await supabase
      .from('disputes')
      .update({
        status: 'resolved',
        resolution,
        arbitrator_id: user.id,
        arbitrator_notes,
        slash_amount: slashAmount,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Determine new bounty state
    let newState: string
    switch (resolution) {
      case 'funder_wins':
        newState = 'refunding'
        break
      case 'lab_wins':
        newState = 'completed_payout'
        break
      case 'partial_refund':
        newState = 'partial_settlement'
        break
    }

    // Update bounty state
    await supabase
      .from('bounties')
      .update({
        state: newState,
        completed_at: new Date().toISOString(),
      })
      .eq('id', dispute.bounty_id)

    // Update state history
    await supabase.rpc('append_state_history', {
      p_bounty_id: dispute.bounty_id,
      p_from_state: 'dispute_resolution',
      p_to_state: newState,
      p_changed_by: user.id
    })

    // Handle stake slashing if funder wins
    if (resolution === 'funder_wins' && slashAmount > 0 && dispute.bounty.selected_lab) {
      const lab = dispute.bounty.selected_lab
      const currentBalance = parseFloat(lab.staking_balance) || 0
      const currentLocked = parseFloat(lab.locked_stake) || 0

      // Record slash transaction
      await supabase.from('staking_transactions').insert({
        lab_id: lab.id,
        bounty_id: dispute.bounty_id,
        type: 'slash',
        amount: slashAmount,
        balance_after: currentBalance - slashAmount,
        notes: `Slashed due to dispute resolution: ${dispute.reason}`,
      })

      // Update lab balances
      await supabase
        .from('labs')
        .update({
          staking_balance: currentBalance - slashAmount,
          locked_stake: Math.max(0, currentLocked - slashAmount),
        })
        .eq('id', lab.id)
    }

    // Unlock remaining stake if any
    if (dispute.bounty.selected_lab) {
      const lab = dispute.bounty.selected_lab
      const currentLocked = parseFloat(lab.locked_stake) || 0

      if (currentLocked > slashAmount) {
        // Record unlock transaction
        await supabase.from('staking_transactions').insert({
          lab_id: lab.id,
          bounty_id: dispute.bounty_id,
          type: 'unlock',
          amount: currentLocked - slashAmount,
          balance_after: parseFloat(lab.staking_balance) - slashAmount,
          notes: 'Stake unlocked after dispute resolution',
        })

        await supabase
          .from('labs')
          .update({ locked_stake: 0 })
          .eq('id', lab.id)
      }
    }

    // Notify both parties
    const notifications = [
      {
        user_id: dispute.bounty.funder_id,
        type: 'dispute_resolved' as const,
        title: 'Dispute Resolved',
        message: `The dispute for "${dispute.bounty.title}" has been resolved.`,
        data: { bounty_id: dispute.bounty_id, dispute_id: id, resolution },
      },
    ]

    if (dispute.bounty.selected_lab?.user_id) {
      notifications.push({
        user_id: dispute.bounty.selected_lab.user_id,
        type: 'dispute_resolved' as const,
        title: 'Dispute Resolved',
        message: `The dispute for "${dispute.bounty.title}" has been resolved.`,
        data: { bounty_id: dispute.bounty_id, dispute_id: id, resolution },
      })
    }

    await supabase.from('notifications').insert(notifications)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      bounty_id: dispute.bounty_id,
      action: 'dispute_resolved',
      details: {
        dispute_id: id,
        resolution,
        slash_amount: slashAmount,
      },
    })

    return NextResponse.json({
      success: true,
      resolution,
      new_state: newState,
      slash_amount: slashAmount,
    })
  } catch (error) {
    console.error('Error in POST /api/disputes/[id]/resolve:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
