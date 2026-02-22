import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyFunderBountyApproved, notifyFunderBountyRejected } from '@/lib/email'

// GET /api/admin/bounties — list all bounties pending review
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabaseAdmin = createAdminClient()

  const { data: bounties, error } = await supabaseAdmin
    .from('bounties')
    .select(`
      *,
      funder:users!bounties_funder_id_fkey(id, email, full_name, wallet_address_evm),
      milestones(*)
    `)
    .eq('state', 'admin_review')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bounties })
}

// POST /api/admin/bounties — approve or reject a bounty
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { bountyId, action, reason } = body // action: 'approve' | 'reject'

  if (!bountyId || !action) {
    return NextResponse.json({ error: 'Missing bountyId or action' }, { status: 400 })
  }

  // Fetch the bounty
  const { data: bounty, error: fetchError } = await supabaseAdmin
    .from('bounties')
    .select('*, funder:users!bounties_funder_id_fkey(email, full_name)')
    .eq('id', bountyId)
    .single()

  if (fetchError || !bounty) {
    return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
  }

  const newState = action === 'approve' ? 'funding_escrow' : 'cancelled'
  const historyEntry = {
    state: newState,
    timestamp: new Date().toISOString(),
    by: user.id,
    action,
    reason: reason || null,
  }

  const currentHistory = Array.isArray(bounty.state_history) ? bounty.state_history : []

  const { error: updateError } = await supabaseAdmin
    .from('bounties')
    .update({
      state: newState,
      state_history: [...currentHistory, historyEntry],
    })
    .eq('id', bountyId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Notify funder via in-app notification
  await supabaseAdmin.from('notifications').insert({
    user_id: bounty.funder_id,
    type: action === 'approve' ? 'bounty_update' : 'system',
    title: action === 'approve' ? 'Bounty Approved — Now Live' : 'Bounty Needs Revision',
    message: action === 'approve'
      ? `"${bounty.title}" has been approved. Fund it to start receiving proposals.`
      : `"${bounty.title}" requires changes: ${reason || 'Please review and resubmit.'}`,
    data: { bounty_id: bountyId },
  }).catch(() => {})

  // Send email to funder
  const funderEmail = bounty.funder?.email
  if (funderEmail && !funderEmail.includes('@sciflow.local')) {
    if (action === 'approve') {
      await notifyFunderBountyApproved({ id: bountyId, title: bounty.title, funderEmail }).catch(console.error)
    } else {
      await notifyFunderBountyRejected({ id: bountyId, title: bounty.title, funderEmail, reason: reason || 'Please revise and resubmit.' }).catch(console.error)
    }
  }

  // Log admin action
  await supabaseAdmin.from('activity_logs').insert({
    user_id: user.id,
    bounty_id: bountyId,
    action: `admin_${action}`,
    details: { reason, new_state: newState },
  }).catch(() => {})

  return NextResponse.json({ success: true, state: newState })
}
