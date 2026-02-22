import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/notifications — fetch user's notifications
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unread') === 'true'

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (unreadOnly) query = query.eq('read', false)

  const { data, error: fetchErr } = await query
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const unreadCount = (data || []).filter(n => !n.read).length
  return NextResponse.json({ notifications: data || [], unreadCount })
}

// PATCH /api/notifications — mark notifications as read
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ids, markAllRead } = body

  if (markAllRead) {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  } else if (ids?.length) {
    await supabase.from('notifications').update({ read: true }).in('id', ids).eq('user_id', user.id)
  }

  return NextResponse.json({ success: true })
}
