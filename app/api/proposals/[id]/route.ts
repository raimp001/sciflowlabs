import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/proposals/[id] - Get proposal details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(`
        *,
        bounty:bounties!proposals_bounty_id_fkey(
          id, title, description, total_budget, currency, state, funder_id,
          funder:users!bounties_funder_id_fkey(id, full_name, avatar_url)
        ),
        lab:labs!proposals_lab_id_fkey(
          id, name, verification_tier, reputation_score, description, institution_affiliation
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Error in GET /api/proposals/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/proposals/[id] - Update proposal status (accept/reject)
export async function PATCH(
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

    // Get proposal with bounty info
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        bounty:bounties!proposals_bounty_id_fkey(id, funder_id, state),
        lab:labs!proposals_lab_id_fkey(id, user_id, name)
      `)
      .eq('id', id)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, rejection_reason } = body

    // Verify the user is the bounty funder
    if (proposal.bounty.funder_id !== user.id) {
      return NextResponse.json({ error: 'Only the bounty funder can update proposal status' }, { status: 403 })
    }

    // Verify bounty is in correct state (bidding is when proposals can be accepted/rejected)
    if (proposal.bounty.state !== 'bidding') {
      return NextResponse.json({ error: 'Bounty is not accepting proposal decisions' }, { status: 400 })
    }

    if (action === 'accept') {
      // Accept this proposal
      const { error: updateError } = await supabase
        .from('proposals')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Reject all other proposals for this bounty
      await supabase
        .from('proposals')
        .update({ 
          status: 'rejected',
          rejection_reason: 'Another proposal was selected',
        })
        .eq('bounty_id', proposal.bounty_id)
        .neq('id', id)

      // Update bounty with selected lab and transition to active_research state
      await supabase
        .from('bounties')
        .update({
          selected_lab_id: proposal.lab_id,
          state: 'active_research',
          started_at: new Date().toISOString(),
        })
        .eq('id', proposal.bounty_id)

      // Update state history using RPC function
      await supabase.rpc('append_state_history', {
        p_bounty_id: proposal.bounty_id,
        p_from_state: 'bidding',
        p_to_state: 'active_research',
        p_changed_by: user.id
      })

      // Notify lab
      await supabase.from('notifications').insert({
        user_id: proposal.lab.user_id,
        type: 'proposal_accepted',
        title: 'Proposal Accepted!',
        message: `Your proposal has been accepted for the bounty`,
        data: { bounty_id: proposal.bounty_id, proposal_id: id },
      })

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        bounty_id: proposal.bounty_id,
        action: 'proposal_accepted',
        details: { proposal_id: id, lab_id: proposal.lab_id },
      })

      return NextResponse.json({ success: true, status: 'accepted' })
    } else if (action === 'reject') {
      // Reject this proposal
      const { error: updateError } = await supabase
        .from('proposals')
        .update({ 
          status: 'rejected',
          rejection_reason: rejection_reason || 'Proposal did not meet requirements',
        })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Notify lab
      await supabase.from('notifications').insert({
        user_id: proposal.lab.user_id,
        type: 'proposal_rejected',
        title: 'Proposal Not Selected',
        message: rejection_reason || 'Your proposal was not selected for this bounty',
        data: { bounty_id: proposal.bounty_id, proposal_id: id },
      })

      return NextResponse.json({ success: true, status: 'rejected' })
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "accept" or "reject"' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in PATCH /api/proposals/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
