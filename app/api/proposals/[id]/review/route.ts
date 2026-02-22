/**
 * app/api/proposals/[id]/review/route.ts  (PR#3)
 *
 * GET   /api/proposals/:id/review
 *   – Returns all ProposalReview rows for a proposal
 *   – Reviewers see own review; admins/funders see all
 *   – Labs see only aggregate score (double-blind until decision)
 *
 * POST  /api/proposals/:id/review
 *   – Creates or updates a reviewer's scorecard
 *   – Requires role='reviewer' (assigned by admin)
 *   – On submission: recomputes overall_score, updates proposal peer_review_status
 *   – If approvals >= bounty.peer_review_threshold → proposal peer_review_status='approved'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }             from '@/lib/supabase/server'
import type { ReviewDecision }       from '@/types/database'

type Ctx = { params: { id: string } }

// Weights for overall_score computation
const WEIGHTS = {
  score_scientific_merit:    0.30,
  score_feasibility:         0.20,
  score_innovation:          0.20,
  score_team_qualifications: 0.15,
  score_ethics_compliance:   0.15,
} as const

function computeOverallScore(scores: Record<string, number>): number {
  let total = 0
  for (const [field, weight] of Object.entries(WEIGHTS)) {
    total += (scores[field] ?? 0) * weight
  }
  return Math.round(total * 100) / 100
}

// ── GET ────────────────────────────────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: Ctx) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'lab'
  const proposalId = params.id

  // Admins and funders see full reviews
  if (role === 'admin' || role === 'funder') {
    const { data, error } = await supabase
      .from('proposal_reviews')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ reviews: data })
  }

  // Reviewers see only their own review
  if (role === 'reviewer') {
    const { data, error } = await supabase
      .from('proposal_reviews')
      .select('*')
      .eq('proposal_id', proposalId)
      .eq('reviewer_id', user.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ review: data })
  }

  // Labs see only aggregate (double-blind: no reviewer info, no comments until approved)
  const { data: reviews } = await supabase
    .from('proposal_reviews')
    .select('overall_score, decision, submitted_at')
    .eq('proposal_id', proposalId)
    .not('submitted_at', 'is', null)

  const submitted = (reviews ?? []).filter((r) => r.submitted_at)
  const avgScore = submitted.length
    ? submitted.reduce((s, r) => s + (r.overall_score ?? 0), 0) / submitted.length
    : null

  return NextResponse.json({
    aggregate: {
      count:         submitted.length,
      average_score: avgScore ? Math.round(avgScore * 100) / 100 : null,
      approvals:     submitted.filter((r) => r.decision === 'approve').length,
      revisions:     submitted.filter((r) => r.decision === 'revise').length,
      rejections:    submitted.filter((r) => r.decision === 'reject').length,
    },
  })
}

// ── POST ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest, { params }: Ctx) {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Must be a reviewer
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'reviewer') {
    return NextResponse.json(
      { error: 'Only users with role=reviewer may submit reviews' },
      { status: 403 }
    )
  }

  const proposalId = params.id

  // Validate proposal exists
  const { data: proposal, error: propErr } = await supabase
    .from('proposals')
    .select('*, bounties(peer_review_threshold, peer_review_required)')
    .eq('id', proposalId)
    .single()

  if (propErr || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
  }

  // Parse body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate scores (1–5)
  const scoreFields = Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]
  for (const field of scoreFields) {
    const v = body[field]
    if (typeof v !== 'number' || v < 1 || v > 5) {
      return NextResponse.json(
        { error: `${field} must be a number between 1 and 5` },
        { status: 400 }
      )
    }
  }

  const validDecisions: ReviewDecision[] = ['approve', 'revise', 'reject']
  if (!validDecisions.includes(body.decision as ReviewDecision)) {
    return NextResponse.json(
      { error: 'decision must be approve | revise | reject' },
      { status: 400 }
    )
  }

  const overallScore = computeOverallScore(body as Record<string, number>)

  // Upsert the review (one reviewer = one review per proposal)
  const reviewPayload = {
    proposal_id:               proposalId,
    bounty_id:                 proposal.bounty_id,
    reviewer_id:               user.id,
    is_blind:                  true,
    score_scientific_merit:    body.score_scientific_merit    as number,
    score_feasibility:         body.score_feasibility         as number,
    score_innovation:          body.score_innovation          as number,
    score_team_qualifications: body.score_team_qualifications as number,
    score_ethics_compliance:   body.score_ethics_compliance   as number,
    overall_score:             overallScore,
    strengths:                 (body.strengths as string)  ?? '',
    weaknesses:                (body.weaknesses as string) ?? '',
    requested_revisions:       (body.requested_revisions as string) ?? null,
    decision:                  body.decision as ReviewDecision,
    conflict_of_interest:      !!(body.conflict_of_interest),
    conflict_details:          (body.conflict_details as string) ?? null,
    submitted_at:              new Date().toISOString(),
    updated_at:                new Date().toISOString(),
  }

  const { data: savedReview, error: saveErr } = await supabase
    .from('proposal_reviews')
    .upsert(reviewPayload, {
      onConflict: 'proposal_id,reviewer_id',
    })
    .select()
    .single()

  if (saveErr) {
    console.error('[review] upsert error:', saveErr)
    return NextResponse.json({ error: saveErr.message }, { status: 500 })
  }

  // Recompute proposal peer_review_status
  const { data: allReviews } = await supabase
    .from('proposal_reviews')
    .select('decision')
    .eq('proposal_id', proposalId)
    .not('submitted_at', 'is', null)

  const submitted   = allReviews ?? []
  const approvals   = submitted.filter((r) => r.decision === 'approve').length
  const rejections  = submitted.filter((r) => r.decision === 'reject').length
  const threshold   = (proposal as any).bounties?.peer_review_threshold ?? 2

  let peerStatus: string
  if (approvals >= threshold)   peerStatus = 'approved'
  else if (rejections >= threshold) peerStatus = 'rejected'
  else                           peerStatus = 'in_review'

  await supabase
    .from('proposals')
    .update({
      peer_review_status:    peerStatus,
      peer_review_approvals: approvals,
      peer_review_rejections: rejections,
      updated_at:            new Date().toISOString(),
    })
    .eq('id', proposalId)

  return NextResponse.json({
    review:      savedReview,
    peer_status: peerStatus,
    approvals,
    rejections,
  })
}
