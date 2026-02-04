import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/bounties - List all bounties for admin review
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state') || 'drafting' // Default to pending review
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build query
    let query = supabase
      .from('bounties')
      .select(`
        *,
        funder:users!funder_id(id, email, full_name, avatar_url, wallet_address_evm),
        milestones(*),
        proposals(count)
      `, { count: 'exact' })

    // Filter by state if provided
    if (state !== 'all') {
      query = query.eq('state', state)
    }

    // Order by most recent
    query = query.order('created_at', { ascending: false })

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching admin bounties:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get stats for dashboard
    const { data: stats } = await supabase
      .from('bounties')
      .select('state')

    const stateCounts = {
      pending_review: 0,
      seeking_proposals: 0,
      active_research: 0,
      disputed: 0,
      completed: 0,
      cancelled: 0,
    }

    if (stats) {
      stats.forEach(b => {
        if (b.state === 'drafting') stateCounts.pending_review++
        else if (b.state === 'seeking_proposals') stateCounts.seeking_proposals++
        else if (b.state === 'active_research' || b.state === 'milestone_review') stateCounts.active_research++
        else if (b.state === 'disputed') stateCounts.disputed++
        else if (b.state === 'completed') stateCounts.completed++
        else if (b.state === 'cancelled') stateCounts.cancelled++
      })
    }

    return NextResponse.json({
      bounties: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats: stateCounts,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/bounties:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
