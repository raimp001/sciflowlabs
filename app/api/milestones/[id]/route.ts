import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams { params: Promise<{ id: string }> }

// POST /api/milestones/[id] — lab submits evidence for a milestone
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { submission_notes, evidence_links, evidence_hash } = body

  if (!submission_notes?.trim()) {
    return NextResponse.json({ error: 'Submission notes are required' }, { status: 400 })
  }

  // Get milestone + verify lab is assigned to the bounty
  const { data: milestone, error: msErr } = await supabase
    .from('milestones')
    .select('*, bounty:bounties!milestones_bounty_id_fkey(id, title, funder_id, selected_lab_id, state)')
    .eq('id', id)
    .single()

  if (msErr || !milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })

  const bounty = milestone.bounty as { id: string; title: string; funder_id: string; selected_lab_id: string; state: string }

  // Verify the submitter is the assigned lab's user
  const { data: lab } = await supabase.from('labs').select('id, user_id').eq('id', bounty.selected_lab_id).single()
  if (!lab || lab.user_id !== user.id) {
    return NextResponse.json({ error: 'Only the assigned lab can submit milestones' }, { status: 403 })
  }

  if (milestone.status !== 'pending' && milestone.status !== 'in_progress') {
    return NextResponse.json({ error: `Cannot submit: milestone is ${milestone.status}` }, { status: 400 })
  }

  if (bounty.state !== 'active_research' && bounty.state !== 'milestone_review') {
    return NextResponse.json({ error: 'Bounty is not in active research phase' }, { status: 400 })
  }

  // Update milestone
  const { error: updateErr } = await supabase
    .from('milestones')
    .update({
      status: 'submitted',
      submission_notes,
      evidence_links: evidence_links || [],
      evidence_hash: evidence_hash || null,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Move bounty to milestone_review if not already
  if (bounty.state === 'active_research') {
    await supabase.from('bounties').update({ state: 'milestone_review' }).eq('id', bounty.id)
  }

  // Notify the funder
  await supabase.from('notifications').insert({
    user_id: bounty.funder_id,
    type: 'milestone_submitted',
    title: 'Milestone Submitted for Review',
    message: `"${milestone.title}" has been submitted with evidence. Please review and approve.`,
    data: { bounty_id: bounty.id, milestone_id: id },
  })

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    bounty_id: bounty.id,
    action: 'milestone_submitted',
    details: { milestone_id: id, title: milestone.title },
  })

  return NextResponse.json({ success: true, status: 'submitted' })
}

// PATCH /api/milestones/[id] — funder approves or rejects milestone
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action, feedback } = body // action: 'approve' | 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  const { data: milestone } = await supabase
    .from('milestones')
    .select('*, bounty:bounties!milestones_bounty_id_fkey(*, selected_lab:labs!bounties_selected_lab_id_fkey(user_id))')
    .eq('id', id)
    .single()

  if (!milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })

  const bounty = milestone.bounty as { id: string; title: string; funder_id: string; total_budget: number; currency: string; selected_lab: { user_id: string } }

  if (bounty.funder_id !== user.id) {
    return NextResponse.json({ error: 'Only the funder can review milestones' }, { status: 403 })
  }

  if (milestone.status !== 'submitted') {
    return NextResponse.json({ error: 'Milestone is not pending review' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'verified' : 'rejected'

  const { error: updateErr } = await supabase
    .from('milestones')
    .update({
      status: newStatus,
      review_feedback: feedback || null,
      verified_at: action === 'approve' ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // If approved: check if all milestones are done, release payout
  if (action === 'approve') {
    const { data: allMilestones } = await supabase
      .from('milestones')
      .select('id, status, payout_percentage')
      .eq('bounty_id', bounty.id)

    const allDone = allMilestones?.every(m => m.id === id ? true : m.status === 'verified')
    if (allDone) {
      await adminClient.from('bounties').update({ state: 'completed', completed_at: new Date().toISOString() }).eq('id', bounty.id)
    } else {
      await adminClient.from('bounties').update({ state: 'active_research' }).eq('id', bounty.id)
    }

    // Log escrow release
    const { data: escrow } = await supabase.from('escrows').select('id, total_amount').eq('bounty_id', bounty.id).single()
    if (escrow) {
      const payoutAmount = (escrow.total_amount * milestone.payout_percentage) / 100
      await adminClient.from('escrow_releases').insert({
        escrow_id: escrow.id,
        milestone_id: id,
        amount: payoutAmount,
      })
    }
  } else {
    // Rejected — move back to active_research
    await supabase.from('bounties').update({ state: 'active_research' }).eq('id', bounty.id)
  }

  // Notify the lab
  const labUserId = bounty.selected_lab?.user_id
  if (labUserId) {
    await supabase.from('notifications').insert({
      user_id: labUserId,
      type: action === 'approve' ? 'milestone_approved' : 'milestone_rejected',
      title: action === 'approve' ? 'Milestone Approved — Payment Released' : 'Milestone Needs Revision',
      message: action === 'approve'
        ? `"${milestone.title}" has been approved. Payout of ${milestone.payout_percentage}% is being processed.`
        : `"${milestone.title}" was not approved. Feedback: ${feedback || 'No feedback provided'}`,
      data: { bounty_id: bounty.id, milestone_id: id },
    })
  }

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    bounty_id: bounty.id,
    action: `milestone_${action}d`,
    details: { milestone_id: id, feedback },
  })

  return NextResponse.json({ success: true, status: newStatus })
}
