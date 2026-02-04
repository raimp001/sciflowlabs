import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

// POST /api/admin/bounties/[id]/approve - Approve or reject a bounty
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bountyId } = await params
    const supabase = await createClient()

    // Verify authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse and validate body
    const body = await request.json()
    const validationResult = approvalSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { action, reason } = validationResult.data

    // Get the bounty
    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .select('*, funder:users!funder_id(id, email, full_name)')
      .eq('id', bountyId)
      .single()

    if (bountyError || !bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    // Only allow approval of bounties in drafting state
    if (bounty.state !== 'drafting') {
      return NextResponse.json(
        { error: 'Can only approve/reject bounties in drafting state' },
        { status: 400 }
      )
    }

    const newState = action === 'approve' ? 'seeking_proposals' : 'cancelled'
    const newStateHistory = [
      ...(bounty.state_history as Array<{ state: string; timestamp: string; by: string }>),
      {
        state: newState,
        timestamp: new Date().toISOString(),
        by: user.id,
        action: action,
        reason: reason || null,
      },
    ]

    // Update bounty state
    const { data: updatedBounty, error: updateError } = await supabase
      .from('bounties')
      .update({
        state: newState,
        state_history: newStateHistory,
      })
      .eq('id', bountyId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Notify the funder
    const notificationTitle = action === 'approve'
      ? 'Bounty Approved!'
      : 'Bounty Not Approved'

    const notificationMessage = action === 'approve'
      ? `Your bounty "${bounty.title}" has been approved and is now open for proposals from labs.`
      : `Your bounty "${bounty.title}" was not approved.${reason ? ` Reason: ${reason}` : ''} Please review and resubmit.`

    await supabase.from('notifications').insert({
      user_id: bounty.funder_id,
      type: 'bounty_update',
      title: notificationTitle,
      message: notificationMessage,
      data: {
        bounty_id: bountyId,
        action: action,
        reason: reason || null,
      },
    })

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      bounty_id: bountyId,
      action: action === 'approve' ? 'bounty_approved' : 'bounty_rejected',
      details: {
        admin_id: user.id,
        reason: reason || null,
        new_state: newState,
      },
    })

    return NextResponse.json({
      success: true,
      bounty: updatedBounty,
      message: action === 'approve'
        ? 'Bounty approved and now open for proposals'
        : 'Bounty rejected',
    })
  } catch (error) {
    console.error('Error in POST /api/admin/bounties/[id]/approve:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
