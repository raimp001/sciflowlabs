import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { runOpenClawReview } from '@/lib/agents/openclaw-orchestrator'
import { notifyAdminNewBounty } from '@/lib/email'

// Validation schemas
const createBountySchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(10000),
  methodology: z.string().min(20),
  data_requirements: z.array(z.string()).default([]),
  quality_standards: z.array(z.string()).default([]),
  ethics_approval: z.string().optional(),
  total_budget: z.number().positive(),
  currency: z.enum(['USD', 'USDC']).default('USD'),
  deadline: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  visibility: z.enum(['public', 'private', 'invite_only']).default('public'),
  min_lab_tier: z.enum(['unverified', 'basic', 'verified', 'trusted', 'institutional']).default('basic'),
  milestones: z.array(z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    deliverables: z.array(z.string()),
    payout_percentage: z.number().positive().max(100),
    due_date: z.string().datetime().optional(),
  })).min(1),
})

// GET /api/bounties - List bounties with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse query params
    const state = searchParams.get('state')
    const search = searchParams.get('search')
    const tags = searchParams.getAll('tag')
    const minBudget = searchParams.get('minBudget')
    const maxBudget = searchParams.get('maxBudget')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const myBounties = searchParams.get('my') === 'true'

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Build query - simplified to avoid complex join issues
    let query = supabase
      .from('bounties')
      .select(`
        *,
        selected_lab:labs(id, name, verification_tier, reputation_score)
      `, { count: 'exact' })

    // Apply filters
    if (myBounties && user) {
      query = query.eq('funder_id', user.id)
    } else {
      query = query
        .eq('visibility', 'public')
        .not('state', 'in', '(drafting,admin_review,ready_for_funding,funding_escrow)')
    }

    if (state) {
      query = query.eq('state', state)
    }

    if (search) {
      query = query.textSearch('search_vector', search)
    }

    if (tags.length > 0) {
      query = query.contains('tags', tags)
    }

    if (minBudget) {
      query = query.gte('total_budget', parseFloat(minBudget))
    }

    if (maxBudget) {
      query = query.lte('total_budget', parseFloat(maxBudget))
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching bounties:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform to match frontend expectations (state -> current_state)
    const transformedBounties = (data || []).map((bounty: any) => ({
      ...bounty,
      current_state: bounty.state,
    }))

    return NextResponse.json({
      bounties: transformedBounties,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/bounties:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bounties - Create new bounty
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
    const validationResult = createBountySchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { milestones: milestonesData, ...bountyData } = validationResult.data

    // Validate milestone percentages sum to 100
    const totalPercentage = milestonesData.reduce((sum, m) => sum + m.payout_percentage, 0)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Milestone payout percentages must sum to 100%' },
        { status: 400 }
      )
    }

    const openClawResult = runOpenClawReview({
      title: bountyData.title,
      description: bountyData.description,
      methodology: bountyData.methodology,
      dataRequirements: bountyData.data_requirements,
      qualityStandards: bountyData.quality_standards,
      totalBudget: bountyData.total_budget,
      currency: bountyData.currency,
      milestones: milestonesData.map((milestone) => ({
        title: milestone.title,
        description: milestone.description,
        deliverables: milestone.deliverables,
        payoutPercentage: milestone.payout_percentage,
      })),
    })

    if (openClawResult.decision === 'reject') {
      return NextResponse.json(
        {
          error: 'Bounty rejected by safety screening. Revise and resubmit.',
          review: openClawResult,
        },
        { status: 400 }
      )
    }

    // Create bounty
    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .insert({
        ...bountyData,
        funder_id: user.id,
        state: 'admin_review',
        state_history: [
          {
            state: 'drafting',
            timestamp: new Date().toISOString(),
            by: user.id,
          },
          {
            state: 'admin_review',
            timestamp: new Date().toISOString(),
            by: user.id,
            reason: 'Mandatory ethics gate',
            review: {
              traceId: openClawResult.traceId,
              decision: openClawResult.decision,
              score: openClawResult.score,
              signals: openClawResult.signals,
            },
          },
        ],
      })
      .select()
      .single()

    if (bountyError) {
      console.error('Error creating bounty:', bountyError)
      return NextResponse.json({ error: bountyError.message }, { status: 500 })
    }

    // Create milestones
    const milestones = milestonesData.map((m, index) => ({
      bounty_id: bounty.id,
      sequence: index + 1,
      title: m.title,
      description: m.description,
      deliverables: m.deliverables,
      payout_percentage: m.payout_percentage,
      due_date: m.due_date,
    }))

    const { error: milestonesError } = await supabase
      .from('milestones')
      .insert(milestones)

    if (milestonesError) {
      console.error('Error creating milestones:', milestonesError)
      // Rollback bounty creation
      await supabase.from('bounties').delete().eq('id', bounty.id)
      return NextResponse.json({ error: milestonesError.message }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      bounty_id: bounty.id,
      action: 'bounty_created',
      details: {
        title: bounty.title,
        budget: bounty.total_budget,
        openclaw_trace_id: openClawResult.traceId,
        openclaw_decision: openClawResult.decision,
        openclaw_score: openClawResult.score,
      },
    })

    // Notify admins (in-app + email)
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      await supabase.from('notifications').insert(
        admins.map((admin: { id: string }) => ({
          user_id: admin.id,
          type: 'system',
          title: 'New Bounty Requires Review',
          message: `"${bounty.title}" — OpenClaw: ${openClawResult.decision.toUpperCase()} (${openClawResult.score}/100)`,
          data: { bounty_id: bounty.id, openclaw_score: openClawResult.score },
        }))
      )
    }

    // Send email notification to admin
    const { data: funderProfile } = await supabase
      .from('users').select('email').eq('id', user.id).single()

    await notifyAdminNewBounty({
      id: bounty.id,
      title: bounty.title,
      funderEmail: funderProfile?.email || user.email || 'unknown',
      budget: bounty.total_budget,
      currency: bounty.currency,
      openClawScore: openClawResult.score,
      openClawDecision: openClawResult.decision,
      signals: openClawResult.signals,
    }).catch(console.error)

    // Fetch complete bounty with milestones
    const { data: completeBounty } = await supabase
      .from('bounties')
      .select(`*, milestones(*)`)
      .eq('id', bounty.id)
      .single()

    return NextResponse.json(
      {
        ...completeBounty,
        review: openClawResult,
        workflow: {
          next_state: 'admin_review',
          note: 'All new bounties require admin ethics approval before funding.',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/bounties:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
