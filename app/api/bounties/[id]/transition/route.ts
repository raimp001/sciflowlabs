import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * State Machine Transition Rules
 * Defines valid transitions and required conditions
 */
const stateTransitions: Record<string, {
  validEvents: string[]
  targetStates: Record<string, string>
  permissions: ('funder' | 'lab' | 'admin' | 'arbitrator')[]
  conditions?: string[]
}> = {
  drafting: {
    validEvents: ['SUBMIT_DRAFT', 'CANCEL_BOUNTY'],
    targetStates: {
      SUBMIT_DRAFT: 'ready_for_funding',
      CANCEL_BOUNTY: 'cancelled',
    },
    permissions: ['funder'],
  },
  ready_for_funding: {
    validEvents: ['INITIATE_FUNDING', 'CANCEL_BOUNTY'],
    targetStates: {
      INITIATE_FUNDING: 'funding_escrow',
      CANCEL_BOUNTY: 'cancelled',
    },
    permissions: ['funder'],
  },
  funding_escrow: {
    validEvents: ['FUNDING_CONFIRMED', 'FUNDING_FAILED'],
    targetStates: {
      FUNDING_CONFIRMED: 'bidding',
      FUNDING_FAILED: 'ready_for_funding',
    },
    permissions: ['funder', 'admin'],
    conditions: ['escrow_created'],
  },
  bidding: {
    validEvents: ['SELECT_LAB', 'CANCEL_BOUNTY', 'EXTEND_BIDDING'],
    targetStates: {
      SELECT_LAB: 'active_research',
      CANCEL_BOUNTY: 'refunding',
      EXTEND_BIDDING: 'bidding',
    },
    permissions: ['funder'],
    conditions: ['has_proposals'],
  },
  active_research: {
    validEvents: ['SUBMIT_MILESTONE', 'INITIATE_DISPUTE'],
    targetStates: {
      SUBMIT_MILESTONE: 'milestone_review',
      INITIATE_DISPUTE: 'dispute_resolution',
    },
    permissions: ['lab', 'funder'],
  },
  milestone_review: {
    validEvents: ['APPROVE_MILESTONE', 'REQUEST_REVISION', 'INITIATE_DISPUTE'],
    targetStates: {
      APPROVE_MILESTONE: 'active_research', // or completed_payout if last milestone
      REQUEST_REVISION: 'active_research',
      INITIATE_DISPUTE: 'dispute_resolution',
    },
    permissions: ['funder'],
  },
  dispute_resolution: {
    validEvents: ['RESOLVE_DISPUTE'],
    targetStates: {
      RESOLVE_DISPUTE: 'resolved', // actual state depends on resolution
    },
    permissions: ['admin', 'arbitrator'],
  },
  completed_payout: {
    validEvents: ['CONFIRM_PAYOUT'],
    targetStates: {
      CONFIRM_PAYOUT: 'completed',
    },
    permissions: ['admin'],
  },
}

const transitionSchema = z.object({
  event: z.string(),
  data: z.record(z.any()).optional(),
})

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

    // Get user role
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = dbUser?.role || 'funder'

    // Parse request
    const body = await request.json()
    const validationResult = transitionSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { event, data: eventData } = validationResult.data

    // Get current bounty state
    const { data: bounty, error: fetchError } = await supabase
      .from('bounties')
      .select(`
        *,
        milestones(*),
        proposals(*),
        escrow:escrows(*),
        selected_lab:labs(user_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    const currentState = bounty.state
    const transition = stateTransitions[currentState]

    if (!transition) {
      return NextResponse.json(
        { error: `No transitions defined for state: ${currentState}` },
        { status: 400 }
      )
    }

    // Validate event is valid for current state
    if (!transition.validEvents.includes(event)) {
      return NextResponse.json(
        { 
          error: `Event '${event}' is not valid for state '${currentState}'`,
          validEvents: transition.validEvents,
        },
        { status: 400 }
      )
    }

    // Check permissions
    const isOwner = bounty.funder_id === user.id
    const isAssignedLab = bounty.selected_lab?.user_id === user.id
    
    let hasPermission = false
    if (transition.permissions.includes('funder') && isOwner) hasPermission = true
    if (transition.permissions.includes('lab') && isAssignedLab) hasPermission = true
    if (transition.permissions.includes('admin') && userRole === 'admin') hasPermission = true
    if (transition.permissions.includes('arbitrator') && userRole === 'arbitrator') hasPermission = true

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to perform this action' },
        { status: 403 }
      )
    }

    // Determine target state
    let targetState = transition.targetStates[event]

    // Special logic for certain events
    if (event === 'APPROVE_MILESTONE') {
      const completedMilestones = bounty.milestones.filter((m: { status: string }) => m.status === 'verified').length
      if (completedMilestones + 1 >= bounty.milestones.length) {
        targetState = 'completed_payout'
      }
    }

    if (event === 'RESOLVE_DISPUTE' && eventData?.resolution) {
      switch (eventData.resolution) {
        case 'funder_wins':
          targetState = 'refunding'
          break
        case 'lab_wins':
          targetState = 'completed_payout'
          break
        case 'partial_refund':
          targetState = 'partial_settlement'
          break
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {
      state: targetState,
      updated_at: new Date().toISOString(),
    }

    // Add timestamps based on event
    if (event === 'FUNDING_CONFIRMED') {
      updates.funded_at = new Date().toISOString()
    }
    if (event === 'SELECT_LAB') {
      updates.started_at = new Date().toISOString()
      updates.selected_lab_id = eventData?.labId
    }
    if (targetState === 'completed' || targetState === 'completed_payout') {
      updates.completed_at = new Date().toISOString()
    }

    // Perform state transition
    const { data: updatedBounty, error: updateError } = await supabase
      .from('bounties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Handle side effects
    await handleTransitionSideEffects(supabase, bounty, event, eventData, user.id)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      bounty_id: id,
      action: `state_transition:${event}`,
      details: {
        from_state: currentState,
        to_state: targetState,
        event_data: eventData,
      },
    })

    // Send notifications
    await sendTransitionNotifications(supabase, bounty, event, targetState, user.id)

    return NextResponse.json({
      success: true,
      previousState: currentState,
      newState: targetState,
      bounty: updatedBounty,
    })
  } catch (error) {
    console.error('Error in POST /api/bounties/[id]/transition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleTransitionSideEffects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bounty: { id: string; milestones: Array<{ id: string; sequence: number }>; selected_lab?: { user_id: string } | null; proposals: Array<{ id: string; lab_id: string; staked_amount: number }> },
  event: string,
  eventData: Record<string, unknown> | undefined,
  userId: string
) {
  switch (event) {
    case 'SELECT_LAB':
      // Update proposal status
      if (eventData?.proposalId) {
        await supabase
          .from('proposals')
          .update({ status: 'accepted' })
          .eq('id', eventData.proposalId)

        // Reject other proposals
        await supabase
          .from('proposals')
          .update({ status: 'rejected' })
          .eq('bounty_id', bounty.id)
          .neq('id', eventData.proposalId)

        // Lock stake for accepted lab
        const proposal = bounty.proposals.find(p => p.id === eventData.proposalId)
        if (proposal) {
          await supabase.from('staking_transactions').insert({
            lab_id: proposal.lab_id,
            bounty_id: bounty.id,
            type: 'lock',
            amount: proposal.staked_amount,
            balance_after: 0, // Will be calculated by trigger
          })
        }
      }

      // Set first milestone to in_progress
      const firstMilestone = bounty.milestones.find(m => m.sequence === 1)
      if (firstMilestone) {
        await supabase
          .from('milestones')
          .update({ status: 'in_progress' })
          .eq('id', firstMilestone.id)
      }
      break

    case 'APPROVE_MILESTONE':
      if (eventData?.milestoneId) {
        // Update milestone status
        await supabase
          .from('milestones')
          .update({ 
            status: 'verified',
            verified_at: new Date().toISOString(),
          })
          .eq('id', eventData.milestoneId)

        // Get milestone to calculate payout
        const { data: milestone } = await supabase
          .from('milestones')
          .select('*, bounty:bounties(total_budget)')
          .eq('id', eventData.milestoneId)
          .single()

        if (milestone) {
          const payoutAmount = (milestone.payout_percentage / 100) * (milestone.bounty as { total_budget: number }).total_budget

          // Create escrow release
          const { data: escrow } = await supabase
            .from('escrows')
            .select('id')
            .eq('bounty_id', bounty.id)
            .single()

          if (escrow) {
            await supabase.from('escrow_releases').insert({
              escrow_id: escrow.id,
              milestone_id: eventData.milestoneId as string,
              amount: payoutAmount,
            })

            // Update escrow released amount using RPC function for atomic increment
            await supabase.rpc('increment_escrow_released', {
              p_escrow_id: escrow.id,
              p_amount: payoutAmount
            })
          }

          // Set next milestone to in_progress
          const nextMilestone = bounty.milestones.find(m => m.sequence === milestone.sequence + 1)
          if (nextMilestone) {
            await supabase
              .from('milestones')
              .update({ status: 'in_progress' })
              .eq('id', nextMilestone.id)
          }
        }
      }
      break

    case 'INITIATE_DISPUTE':
      if (eventData) {
        await supabase.from('disputes').insert({
          bounty_id: bounty.id,
          initiated_by: userId,
          reason: eventData.reason as string,
          description: eventData.description as string,
          evidence_links: eventData.evidenceLinks as string[] || [],
        })
      }
      break

    case 'RESOLVE_DISPUTE':
      if (eventData) {
        await supabase
          .from('disputes')
          .update({
            status: 'resolved',
            resolution: eventData.resolution as string,
            slash_amount: eventData.slashAmount as number,
            resolved_at: new Date().toISOString(),
          })
          .eq('bounty_id', bounty.id)
          .eq('status', 'open')

        // Handle stake slashing if funder wins
        if (eventData.resolution === 'funder_wins' && eventData.slashAmount) {
          const proposal = bounty.proposals.find(p => p.status === 'accepted')
          if (proposal) {
            await supabase.from('staking_transactions').insert({
              lab_id: proposal.lab_id,
              bounty_id: bounty.id,
              type: 'slash',
              amount: eventData.slashAmount as number,
              balance_after: 0,
            })
          }
        }
      }
      break
  }
}

async function sendTransitionNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bounty: { id: string; title: string; funder_id: string; selected_lab?: { user_id: string } | null },
  event: string,
  newState: string,
  actorId: string
) {
  const notifications: Array<{
    user_id: string
    type: string
    title: string
    message: string
    data: Record<string, unknown>
  }> = []

  switch (event) {
    case 'SELECT_LAB':
      if (bounty.selected_lab?.user_id) {
        notifications.push({
          user_id: bounty.selected_lab.user_id,
          type: 'proposal_accepted',
          title: 'Proposal Accepted!',
          message: `Your proposal for "${bounty.title}" has been accepted. Research begins now.`,
          data: { bounty_id: bounty.id },
        })
      }
      break

    case 'SUBMIT_MILESTONE':
      notifications.push({
        user_id: bounty.funder_id,
        type: 'milestone_submitted',
        title: 'Milestone Submitted',
        message: `A milestone for "${bounty.title}" has been submitted for review.`,
        data: { bounty_id: bounty.id },
      })
      break

    case 'APPROVE_MILESTONE':
      if (bounty.selected_lab?.user_id) {
        notifications.push({
          user_id: bounty.selected_lab.user_id,
          type: 'milestone_approved',
          title: 'Milestone Approved!',
          message: `Your milestone for "${bounty.title}" has been approved. Payment will be released.`,
          data: { bounty_id: bounty.id },
        })
      }
      break

    case 'REQUEST_REVISION':
      if (bounty.selected_lab?.user_id) {
        notifications.push({
          user_id: bounty.selected_lab.user_id,
          type: 'milestone_rejected',
          title: 'Revision Requested',
          message: `Revisions have been requested for your milestone on "${bounty.title}".`,
          data: { bounty_id: bounty.id },
        })
      }
      break

    case 'INITIATE_DISPUTE':
      const disputeTarget = actorId === bounty.funder_id 
        ? bounty.selected_lab?.user_id 
        : bounty.funder_id
      if (disputeTarget) {
        notifications.push({
          user_id: disputeTarget,
          type: 'dispute_opened',
          title: 'Dispute Opened',
          message: `A dispute has been opened for "${bounty.title}".`,
          data: { bounty_id: bounty.id },
        })
      }
      break
  }

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications as Array<{
      user_id: string
      type: 'bounty_update' | 'proposal_received' | 'proposal_accepted' | 'milestone_submitted' | 'milestone_approved' | 'milestone_rejected' | 'dispute_opened' | 'dispute_resolved' | 'payment_received' | 'system'
      title: string
      message: string
      data: Record<string, unknown>
    }>)
  }
}
