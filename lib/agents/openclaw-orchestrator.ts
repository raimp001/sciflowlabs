/**
 * OpenClaw v2 — Automated bounty risk & quality assessment
 *
 * Runs on every new bounty submission. Returns a risk score, signals,
 * and a routing decision (allow / manual_review / reject).
 *
 * Decisions:
 *  - allow         → goes straight to admin_review queue (low risk, no ethics flags)
 *  - manual_review → admin_review queue with highlighted signals
 *  - reject        → blocked immediately, never reaches admin queue
 */

export type OpenClawDecision = 'allow' | 'manual_review' | 'reject'

export interface OpenClawInput {
  title: string
  description: string
  methodology: string
  dataRequirements: string[]
  qualityStandards: string[]
  totalBudget: number
  currency: 'USD' | 'USDC'
  milestones: Array<{
    title: string
    description: string
    deliverables: string[]
    payoutPercentage: number
  }>
}

export interface OpenClawSignal {
  type: 'harm' | 'ethics' | 'quality' | 'fraud' | 'compliance' | 'dual_use'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  rule?: string
}

export interface OpenClawResult {
  traceId: string
  decision: OpenClawDecision
  score: number  // 0–100 (higher = safer / better quality)
  signals: OpenClawSignal[]
  summary: string
  requiresEthicsReview: boolean
  requiresIRB: boolean
}

// ── Blocked outright ─────────────────────────────────────────────
const REJECT_TERMS: string[] = [
  'bioweapon', 'biological weapon', 'pathogen release', 'weaponize',
  'toxin synthesis for', 'nerve agent', 'chemical weapon',
  'human cloning', 'reproductive cloning',
  'self-harm', 'suicide', 'harm to children',
  'nuclear weapon', 'radiological weapon',
  'deepfake for', 'non-consensual',
]

// ── Requires ethics review ────────────────────────────────────────
const ETHICS_TERMS: string[] = [
  'human subjects', 'human participants', 'patient data', 'patient samples',
  'clinical trial', 'clinical study', 'phase i', 'phase ii', 'phase iii',
  'informed consent', 'irb', 'institutional review',
  'animal study', 'animal model', 'in vivo', 'murine model',
  'genome editing', 'crispr', 'gene therapy', 'germline',
  'personally identifiable', 'pii', 'phi', 'protected health',
  'minors', 'children under', 'pediatric',
  'psychiatric', 'mental health study',
  'stem cell', 'embryo',
]

// ── Dual-use concern ─────────────────────────────────────────────
const DUAL_USE_TERMS: string[] = [
  'gain of function', 'enhanced pathogen', 'transmissibility',
  'antibiotic resistance', 'drug resistance mechanism',
  'surveillance', 'tracking individuals',
  'autonomous weapon', 'lethal autonomous',
]

// ── Quality red flags ─────────────────────────────────────────────
const VAGUE_TERMS: string[] = [
  'figure it out', 'we will decide later', 'tbd', 'to be determined',
  'as needed', 'whatever works', 'flexible',
]

function contains(text: string, terms: string[]): string | null {
  const norm = text.toLowerCase()
  return terms.find(t => norm.includes(t)) ?? null
}

function buildFullText(input: OpenClawInput): string {
  return [
    input.title,
    input.description,
    input.methodology,
    input.dataRequirements.join(' '),
    input.qualityStandards.join(' '),
    input.milestones.flatMap(m => [m.title, m.description, ...m.deliverables]).join(' '),
  ].join('\n').toLowerCase()
}

export function runOpenClawReview(input: OpenClawInput): OpenClawResult {
  const text = buildFullText(input)
  const signals: OpenClawSignal[] = []
  let score = 100
  let requiresEthicsReview = false
  let requiresIRB = false

  // ── 1. Hard reject terms ──────────────────────────────────────
  const rejectMatch = contains(text, REJECT_TERMS)
  if (rejectMatch) {
    signals.push({
      type: 'harm',
      severity: 'critical',
      message: `Prohibited content detected: "${rejectMatch}". This bounty cannot be posted.`,
      rule: 'HARD_BLOCK',
    })
    score = 0
  }

  // ── 2. Dual-use flagging ──────────────────────────────────────
  const dualUseMatch = contains(text, DUAL_USE_TERMS)
  if (dualUseMatch) {
    signals.push({
      type: 'dual_use',
      severity: 'high',
      message: `Dual-use research concern: "${dualUseMatch}". Requires enhanced admin review and institutional affiliation.`,
      rule: 'DUAL_USE',
    })
    score -= 40
    requiresEthicsReview = true
  }

  // ── 3. Ethics / IRB triggers ──────────────────────────────────
  const ethicsMatch = contains(text, ETHICS_TERMS)
  if (ethicsMatch) {
    requiresEthicsReview = true
    const needsIRB = ['human subjects', 'human participants', 'patient', 'clinical trial',
      'informed consent', 'irb', 'minors', 'pediatric'].some(t => text.includes(t))
    if (needsIRB) {
      requiresIRB = true
      signals.push({
        type: 'ethics',
        severity: 'high',
        message: `IRB/ethics board approval required before lab work begins. Triggered by: "${ethicsMatch}".`,
        rule: 'IRB_REQUIRED',
      })
      score -= 25
    } else {
      signals.push({
        type: 'ethics',
        severity: 'medium',
        message: `Sensitive research domain detected ("${ethicsMatch}"). Ethics documentation must be included as a milestone deliverable.`,
        rule: 'ETHICS_REVIEW',
      })
      score -= 15
    }
  }

  // ── 4. Milestone quality checks ───────────────────────────────
  if (input.milestones.length < 2) {
    signals.push({
      type: 'quality',
      severity: 'medium',
      message: 'Single-milestone bounties reduce accountability. Recommend at least 2 checkpoints.',
      rule: 'MIN_MILESTONES',
    })
    score -= 15
  }

  const unbalanced = input.milestones.filter(m => m.payoutPercentage > 60)
  if (unbalanced.length > 0) {
    signals.push({
      type: 'quality',
      severity: 'low',
      message: `One milestone holds >${unbalanced[0].payoutPercentage}% of the budget. Consider spreading payouts for better lab incentive alignment.`,
      rule: 'PAYOUT_BALANCE',
    })
    score -= 8
  }

  const vagueCount = [input.description, input.methodology].filter(f => f.trim().length < 80).length
  if (vagueCount > 0) {
    signals.push({
      type: 'quality',
      severity: 'low',
      message: 'Description or methodology is too brief. Labs need detail to assess feasibility and bid accurately.',
      rule: 'VAGUE_SCOPE',
    })
    score -= 10
  }

  const vagueMatch = contains(text, VAGUE_TERMS)
  if (vagueMatch) {
    signals.push({
      type: 'quality',
      severity: 'low',
      message: `Vague language detected ("${vagueMatch}"). Replace with specific, measurable criteria.`,
      rule: 'VAGUE_LANGUAGE',
    })
    score -= 8
  }

  // ── 5. Budget sanity ──────────────────────────────────────────
  if (input.totalBudget > 0 && input.totalBudget < 500) {
    signals.push({
      type: 'fraud',
      severity: 'low',
      message: 'Budget under $500 is below typical lab costs. May not attract qualified submissions.',
      rule: 'LOW_BUDGET',
    })
    score -= 8
  }

  if (input.totalBudget > 1_000_000) {
    signals.push({
      type: 'compliance',
      severity: 'medium',
      message: 'Bounties over $1M require enhanced funder verification and legal review before publishing.',
      rule: 'HIGH_VALUE_REVIEW',
    })
    score -= 10
    requiresEthicsReview = true
  }

  // ── 6. Deliverable specificity ────────────────────────────────
  const emptyDeliverables = input.milestones.filter(m => m.deliverables.length === 0)
  if (emptyDeliverables.length > 0) {
    signals.push({
      type: 'quality',
      severity: 'medium',
      message: `${emptyDeliverables.length} milestone(s) have no deliverables defined. Labs cannot verify what they need to produce.`,
      rule: 'EMPTY_DELIVERABLES',
    })
    score -= 12
  }

  score = Math.max(0, Math.min(100, score))

  // ── Decision logic ────────────────────────────────────────────
  let decision: OpenClawDecision = 'allow'

  if (signals.some(s => s.severity === 'critical')) {
    decision = 'reject'
  } else if (signals.some(s => s.severity === 'high') || score < 55) {
    decision = 'manual_review'
  } else if (signals.length > 0) {
    decision = 'manual_review'
  }

  // Build a human-readable summary
  const summary = decision === 'reject'
    ? 'Bounty blocked — prohibited content detected. Will not enter review queue.'
    : decision === 'manual_review'
    ? `Score ${score}/100. ${signals.length} signal(s) flagged — requires admin review before going live.`
    : `Score ${score}/100. Clean submission — proceeding to admin review queue.`

  return {
    traceId: `oc2_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
    decision,
    score,
    signals,
    summary,
    requiresEthicsReview,
    requiresIRB,
  }
}
