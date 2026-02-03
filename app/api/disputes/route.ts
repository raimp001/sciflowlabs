import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createDisputeSchema = z.object({
  bounty_id: z.string().uuid(),
  reason: z.enum([
    'data_falsification',
    'protocol_deviation',
    'sample_tampering',
    'timeline_breach',
    'quality_failure',
    'communication_failure'
  ]),
  description: z.string().min(20).max(5000),
  evidence_links: z.array(z.string().url()).default([]),
})

/**
 * GET /api/disputes - List disputes (admin/arbitrator only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const bountyId = searchParams.get('bounty_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('disputes')
      .select(`
        *,
        bounty:bounties!disputes_bounty_id_fkey(id, title, funder_id, selected_lab_id),
        initiated_by_user:users!disputes_initiated_by_fkey(id, full_name, email)
      `, { count: 'exact' })

    // Non-admin/arbitrator can only see their own disputes
    if (dbUser?.role !== 'admin' && dbUser?.role !== 'arbitrator') {
      query = query.or(`bounty.funder_id.eq.${user.id},initiated_by.eq.${user.id}`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (bountyId) {
      query = query.eq('bounty_id', bountyId)
    }

    query = query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    const { data: disputes, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      disputes: disputes || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/disputes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/disputes - Create a new dispute
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate body
    const body = await request.json()
    const validationResult = createDisputeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { bounty_id, reason, description, evidence_links } = validationResult.data

    // Get bounty
    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .select(`
        *,
        selected_lab:labs!bounties_selected_lab_id_fkey(id, user_id)
      `)
      .eq('id', bounty_id)
      .single()

    if (bountyError || !bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    // Verify user is either funder or assigned lab
    const isFunder = bounty.funder_id === user.id
    const isLab = bounty.selected_lab?.user_id === user.id

    if (!isFunder && !isLab) {
      return NextResponse.json({ error: 'You are not a party to this bounty' }, { status: 403 })
    }

    // Check bounty is in disputable state
    const disputableStates = ['active_research', 'milestone_review']
    if (!disputableStates.includes(bounty.state)) {
      return NextResponse.json({
        error: `Cannot create dispute for bounty in state: ${bounty.state}`
      }, { status: 400 })
    }

    // Check if there's already an open dispute
    const { data: existingDispute } = await supabase
      .from('disputes')
      .select('id')
      .eq('bounty_id', bounty_id)
      .in('status', ['open', 'under_review', 'arbitration'])
      .single()

    if (existingDispute) {
      return NextResponse.json({ error: 'There is already an open dispute for this bounty' }, { status: 400 })
    }

    // Create the dispute
    const { data: dispute, error: createError } = await supabase
      .from('disputes')
      .insert({
        bounty_id,
        initiated_by: user.id,
        reason,
        description,
        evidence_links,
        status: 'open',
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Update bounty state to dispute_resolution
    await supabase
      .from('bounties')
      .update({ state: 'dispute_resolution' })
      .eq('id', bounty_id)

    // Update state history
    await supabase.rpc('append_state_history', {
      p_bounty_id: bounty_id,
      p_from_state: bounty.state,
      p_to_state: 'dispute_resolution',
      p_changed_by: user.id
    })

    // Notify the other party
    const notifyUserId = isFunder ? bounty.selected_lab?.user_id : bounty.funder_id
    if (notifyUserId) {
      await supabase.from('notifications').insert({
        user_id: notifyUserId,
        type: 'dispute_opened',
        title: 'Dispute Filed',
        message: `A dispute has been filed for bounty "${bounty.title}"`,
        data: { bounty_id, dispute_id: dispute.id, reason },
      })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      bounty_id,
      action: 'dispute_created',
      details: { dispute_id: dispute.id, reason },
    })

    return NextResponse.json(dispute, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/disputes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
