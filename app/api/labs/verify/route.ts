import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/labs/verify — lab requests tier upgrade
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { requestedTier, credentials, publications, institution, notes } = body

  const { data: lab } = await supabase.from('labs').select('id, name, verification_tier').eq('user_id', user.id).single()
  if (!lab) return NextResponse.json({ error: 'No lab profile found. Create a lab profile first.' }, { status: 404 })

  const tierOrder = ['unverified', 'basic', 'verified', 'trusted', 'institutional']
  const currentIdx = tierOrder.indexOf(lab.verification_tier)
  const requestedIdx = tierOrder.indexOf(requestedTier)

  if (requestedIdx <= currentIdx) {
    return NextResponse.json({ error: 'Can only request a higher verification tier' }, { status: 400 })
  }

  // Store the verification request as a notification to admins
  const adminClient = createAdminClient()
  const { data: admins } = await adminClient.from('users').select('id').eq('role', 'admin')

  if (admins && admins.length > 0) {
    await adminClient.from('notifications').insert(
      admins.map((admin: { id: string }) => ({
        user_id: admin.id,
        type: 'system',
        title: `Lab Verification Request: ${requestedTier}`,
        message: `${lab.name} is requesting ${requestedTier} tier verification.`,
        data: {
          type: 'lab_verification_request',
          lab_id: lab.id,
          lab_name: lab.name,
          current_tier: lab.verification_tier,
          requested_tier: requestedTier,
          credentials,
          publications,
          institution,
          notes,
          submitted_by: user.id,
        },
      }))
    )
  }

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'lab_verification_requested',
    details: { lab_id: lab.id, current_tier: lab.verification_tier, requested_tier: requestedTier },
  })

  return NextResponse.json({ success: true, message: 'Verification request submitted. Admin will review within 2-3 business days.' })
}

// PATCH /api/labs/verify — admin approves/rejects (admin only)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { labId, action, tier, reason } = body

  if (!['approve', 'reject'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const { data: lab } = await adminClient.from('labs').select('*, user_id').eq('id', labId).single()
  if (!lab) return NextResponse.json({ error: 'Lab not found' }, { status: 404 })

  if (action === 'approve' && tier) {
    await adminClient.from('labs').update({ verification_tier: tier }).eq('id', labId)
  }

  await adminClient.from('notifications').insert({
    user_id: lab.user_id,
    type: 'system',
    title: action === 'approve' ? `Verification Approved: ${tier}` : 'Verification Request Declined',
    message: action === 'approve'
      ? `Your lab has been upgraded to ${tier} tier. You can now access higher-value bounties.`
      : `Your verification request was not approved. ${reason || 'Please ensure your credentials are complete.'}`,
    data: { lab_id: labId, action, tier, reason },
  })

  return NextResponse.json({ success: true })
}
