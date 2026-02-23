import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/users — get current user profile
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('*, labs(id, name, verification_tier, reputation_score, specializations, institution_affiliation, website, team_size)')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ profile })
}

// PATCH /api/users — update current user profile
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { full_name, avatar_url, role, lab, onboarding_completed } = body

  // Update user profile
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (full_name !== undefined) updates.full_name = full_name
  if (avatar_url !== undefined) updates.avatar_url = avatar_url
  if (role !== undefined && ['funder', 'lab'].includes(role)) updates.role = role
  if (onboarding_completed !== undefined) updates.onboarding_completed = onboarding_completed

  const { error: updateErr } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // If user is a lab, update lab profile too
  if (lab) {
    const { data: existingLab } = await supabase.from('labs').select('id').eq('user_id', user.id).single()
    const labUpdates: Record<string, unknown> = {}
    if (lab.name) labUpdates.name = lab.name
    if (lab.description) labUpdates.description = lab.description
    if (lab.website !== undefined) labUpdates.website = lab.website
    if (lab.specializations) labUpdates.specializations = lab.specializations
    if (lab.institution_affiliation !== undefined) labUpdates.institution_affiliation = lab.institution_affiliation
    if (lab.team_size !== undefined) labUpdates.team_size = lab.team_size

    if (existingLab) {
      await supabase.from('labs').update(labUpdates).eq('user_id', user.id)
    } else if (updates.role === 'lab' || lab.name) {
      await supabase.from('labs').insert({ user_id: user.id, name: lab.name || 'My Lab', ...labUpdates })
    }
  }

  return NextResponse.json({ success: true })
}
