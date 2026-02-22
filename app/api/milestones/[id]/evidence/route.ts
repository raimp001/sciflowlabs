/**
 * app/api/milestones/[id]/evidence/route.ts  (PR#3)
 *
 * POST  /api/milestones/:id/evidence
 *   – Accepts multipart/form-data with a single "file" field
 *   – Pins the file to IPFS via Pinata
 *   – Writes evidence_hash + evidence_ipfs_url back to the milestone row
 *   – Transitions milestone status to 'submitted'
 *
 * Auth:
 *   – Must be authenticated (Supabase session)
 *   – Must be the lab that owns the proposal linked to this milestone
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }             from '@/lib/supabase/server'
import { pinFile }                  from '@/lib/ipfs/pin'

type Ctx = { params: { id: string } }

export async function POST(request: NextRequest, { params }: Ctx) {
  const supabase = await createClient()

  // ─ Auth ───────────────────────────────────────────────────────────────
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const milestoneId = params.id

  // ─ Fetch milestone + proposal ownership check ──────────────────────────
  const { data: milestone, error: msErr } = await supabase
    .from('milestones')
    .select('*, proposals(lab_id, labs(user_id))')
    .eq('id', milestoneId)
    .single()

  if (msErr || !milestone) {
    return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
  }

  // Verify caller is the lab owner
  const labUserId = (milestone as any).proposals?.labs?.user_id
  if (labUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Can only submit evidence for pending milestones
  if (milestone.status !== 'pending' && milestone.status !== 'submitted') {
    return NextResponse.json(
      { error: `Milestone is ${milestone.status} — cannot update evidence` },
      { status: 409 }
    )
  }

  // ─ Parse multipart file ─────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'Missing "file" field in form data' },
      { status: 400 }
    )
  }

  // 50 MB hard limit
  const MAX_BYTES = 50 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File exceeds 50 MB limit' },
      { status: 413 }
    )
  }

  // ─ Pin to IPFS ────────────────────────────────────────────────────────────
  let pinResult: { cid: string; url: string; size: number }
  try {
    pinResult = await pinFile(file, file.name, {
      milestone_id: milestoneId,
      bounty_id:    String(milestone.bounty_id),
      uploaded_by:  user.id,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'IPFS pin failed'
    console.error('[evidence] pinFile error:', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // ─ Write CID + URL back to DB, advance status ───────────────────────────
  const { data: updated, error: updateErr } = await supabase
    .from('milestones')
    .update({
      evidence_hash:      pinResult.cid,
      evidence_ipfs_url:  pinResult.url,
      status:             'submitted',
      submission_url:     pinResult.url,   // backwards-compat
      updated_at:         new Date().toISOString(),
    })
    .eq('id', milestoneId)
    .select()
    .single()

  if (updateErr) {
    console.error('[evidence] DB update error:', updateErr)
    return NextResponse.json(
      { error: 'Failed to persist evidence hash' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    milestone: updated,
    ipfs: {
      cid:  pinResult.cid,
      url:  pinResult.url,
      size: pinResult.size,
    },
  })
}
