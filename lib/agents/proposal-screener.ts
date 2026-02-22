/**
 * lib/agents/proposal-screener.ts
 *
 * OpenClaw extension for proposal and evidence screening.
 * Uses rule-based checks (fast, no API cost) with quality signals.
 * Called when a lab submits a proposal to a bounty.
 */

export interface ProposalScreenInput {
  proposalMethodology: string
  proposalApproachSummary: string
  timelineDays: number
  bidAmount: number
  stakedAmount: number
  // Bounty context
  bountyTitle: string
  bountyDescription: string
  bountyBudget: number
  bountyMinTier: string
  // Lab context
  labReputationScore: number
  labTier: string
  labCompletedBounties: number
}

export interface EvidenceScreenInput {
  milestoneTitle: string
  milestoneDescription: string
  milestoneDeliverables: string[]
  evidenceDescription: string // from submission_notes
  evidenceFileSize: number // bytes
  evidenceFileType: string
  hasIpfsHash: boolean
}

export interface ProposalScreenResult {
  decision: 'approve' | 'flag' | 'reject'
  score: number // 0-100
  signals: Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
  }>
  summary: string
  requiresManualReview: boolean
}

// ── Quality thresholds ─────────────────────────────────────────────────────
const MIN_METHODOLOGY_LENGTH = 100
const MIN_APPROACH_LENGTH = 50
const MAX_TIMELINE_DAYS = 730 // 2 years
const MIN_STAKE_RATIO = 0.05 // 5% of bid as minimum stake

/**
 * Screen a lab proposal before it enters the funder's view.
 * Returns immediately (synchronous) — no LLM call, no latency.
 */
export function screenProposal(input: ProposalScreenInput): ProposalScreenResult {
  const signals: ProposalScreenResult['signals'] = []
  let score = 100

  // ── 1. Methodology quality ───────────────────────────────────────────────
  if (input.proposalMethodology.trim().length < MIN_METHODOLOGY_LENGTH) {
    signals.push({
      type: 'quality',
      severity: 'medium',
      message: `Methodology too brief (${input.proposalMethodology.trim().length} chars). Labs should provide detailed scientific approaches of at least ${MIN_METHODOLOGY_LENGTH} characters.`,
    })
    score -= 20
  }

  if (input.proposalApproachSummary.trim().length < MIN_APPROACH_LENGTH) {
    signals.push({
      type: 'quality',
      severity: 'low',
      message: 'Approach summary is very brief. A clearer summary helps funders evaluate proposals faster.',
    })
    score -= 10
  }

  // ── 2. Timeline sanity ───────────────────────────────────────────────────
  if (input.timelineDays <= 0) {
    signals.push({
      type: 'fraud',
      severity: 'high',
      message: 'Invalid timeline: must be a positive number of days.',
    })
    score -= 40
  } else if (input.timelineDays > MAX_TIMELINE_DAYS) {
    signals.push({
      type: 'quality',
      severity: 'medium',
      message: `Timeline of ${input.timelineDays} days (${Math.round(input.timelineDays / 365 * 10) / 10} years) is unusually long. Funders prefer shorter milestoned projects.`,
    })
    score -= 15
  } else if (input.timelineDays < 7) {
    signals.push({
      type: 'quality',
      severity: 'medium',
      message: `Timeline of ${input.timelineDays} days is extremely short. Ensure deliverables are achievable.`,
    })
    score -= 10
  }

  // ── 3. Bid vs budget sanity ──────────────────────────────────────────────
  if (input.bidAmount > input.bountyBudget * 1.2) {
    signals.push({
      type: 'compliance',
      severity: 'high',
      message: `Bid (${input.bidAmount}) exceeds bounty budget (${input.bountyBudget}) by more than 20%. This proposal will likely be rejected by the funder.`,
    })
    score -= 30
  } else if (input.bidAmount < input.bountyBudget * 0.1) {
    signals.push({
      type: 'fraud',
      severity: 'medium',
      message: `Bid (${input.bidAmount}) is suspiciously low vs budget (${input.bountyBudget}). May indicate a low-quality or incomplete scope.`,
    })
    score -= 15
  }

  // ── 4. Staking requirement ───────────────────────────────────────────────
  const minStake = input.bidAmount * MIN_STAKE_RATIO
  if (input.stakedAmount < minStake) {
    signals.push({
      type: 'compliance',
      severity: 'high',
      message: `Staked amount (${input.stakedAmount}) is below minimum required stake of ${minStake.toFixed(2)} (${MIN_STAKE_RATIO * 100}% of bid). Increase stake to submit.`,
    })
    score -= 35
  }

  // ── 5. Lab reputation ────────────────────────────────────────────────────
  if (input.labTier === 'unverified') {
    signals.push({
      type: 'compliance',
      severity: 'high',
      message: 'Lab is unverified. Basic KYC verification required before submitting proposals.',
    })
    score -= 40
  } else if (input.labReputationScore < 20 && input.labCompletedBounties > 0) {
    signals.push({
      type: 'fraud',
      severity: 'medium',
      message: `Lab has a low reputation score (${input.labReputationScore}/100) despite prior bounties. Review dispute history.`,
    })
    score -= 20
  }

  score = Math.max(0, Math.min(100, score))

  // ── Decision ─────────────────────────────────────────────────────────────
  let decision: ProposalScreenResult['decision'] = 'approve'
  if (signals.some(s => s.severity === 'critical')) {
    decision = 'reject'
  } else if (signals.some(s => s.severity === 'high') || score < 50) {
    decision = 'flag'
  } else if (signals.length > 2) {
    decision = 'flag'
  }

  const summary = decision === 'reject'
    ? `Proposal rejected. ${signals.length} critical issues found.`
    : decision === 'flag'
    ? `Score ${score}/100. Proposal flagged for manual review. ${signals.length} signal(s) require attention.`
    : `Score ${score}/100. Proposal passes automated screening.`

  return {
    decision,
    score,
    signals,
    summary,
    requiresManualReview: decision === 'flag',
  }
}

/**
 * Screen evidence submission for a milestone.
 * Ensures evidence is substantive before notifying the funder.
 */
export function screenEvidence(input: EvidenceScreenInput): ProposalScreenResult {
  const signals: ProposalScreenResult['signals'] = []
  let score = 100

  // ── 1. Description quality ───────────────────────────────────────────────
  if (input.evidenceDescription.trim().length < 50) {
    signals.push({
      type: 'quality',
      severity: 'medium',
      message: 'Evidence description is too brief. Explain what was done, what data was collected, and how it proves milestone completion.',
    })
    score -= 25
  }

  // ── 2. File presence ─────────────────────────────────────────────────────
  if (!input.hasIpfsHash || input.evidenceFileSize === 0) {
    signals.push({
      type: 'quality',
      severity: 'high',
      message: 'No file evidence uploaded. Funders require at least one data file, report, or analysis to verify milestone completion.',
    })
    score -= 40
  } else if (input.evidenceFileSize < 1024) {
    // Less than 1KB
    signals.push({
      type: 'quality',
      severity: 'medium',
      message: 'Uploaded file is suspiciously small (< 1KB). Ensure the file contains actual data.',
    })
    score -= 15
  }

  // ── 3. File type check ───────────────────────────────────────────────────
  const ACCEPTED_TYPES = [
    'application/pdf', 'text/csv', 'application/json',
    'image/png', 'image/jpeg', 'image/tiff',
    'application/zip', 'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  if (input.evidenceFileType && !ACCEPTED_TYPES.includes(input.evidenceFileType)) {
    signals.push({
      type: 'compliance',
      severity: 'low',
      message: `File type "${input.evidenceFileType}" is unusual for scientific evidence. Preferred types: PDF, CSV, JSON, images, ZIP.`,
    })
    score -= 5
  }

  score = Math.max(0, Math.min(100, score))

  let decision: ProposalScreenResult['decision'] = 'approve'
  if (signals.some(s => s.severity === 'critical')) {
    decision = 'reject'
  } else if (signals.some(s => s.severity === 'high') || score < 50) {
    decision = 'flag'
  }

  const summary = decision === 'reject'
    ? 'Evidence submission rejected.'
    : decision === 'flag'
    ? `Evidence score ${score}/100. Flagged for quality review.`
    : `Evidence score ${score}/100. Submission passes automated checks.`

  return {
    decision,
    score,
    signals,
    summary,
    requiresManualReview: decision === 'flag',
  }
}
