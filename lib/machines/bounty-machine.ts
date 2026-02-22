/**
 * SciFlow Bounty Lifecycle State Machine — v2 (hardened)
 */

import { assign, createMachine } from 'xstate'
import { randomUUID } from 'crypto'

// ============================================================================
// Types & Interfaces
// ============================================================================

export type PaymentMethod = 'stripe' | 'solana_usdc' | 'base_usdc'
export type LabVerificationTier =
  | 'unverified'
  | 'basic'
  | 'verified'
  | 'trusted'
  | 'institutional'
export type DisputeReason =
  | 'data_falsification'
  | 'protocol_deviation'
  | 'sample_tampering'
  | 'timeline_breach'
  | 'quality_failure'
  | 'communication_failure'

export interface Milestone {
  id: string
  title: string
  description: string
  deliverables: string[]
  payoutPercentage: number
  dueDate: Date
  evidenceHash?: string
  verifiedAt?: Date
  status: 'pending' | 'in_progress' | 'submitted' | 'verified' | 'rejected'
  revisionCount: number
}

export interface Proposal {
  id: string
  labId: string
  labName: string
  verificationTier: LabVerificationTier
  methodology: string
  timeline: number // days
  bidAmount: number
  stakedAmount: number
  submittedAt: Date
  attachments: string[]
  openClawScore?: number
}

export interface EscrowDetails {
  method: PaymentMethod
  totalAmount: number
  currency: 'USD' | 'USDC'
  stripePaymentIntentId?: string
  solanaEscrowPDA?: string
  baseContractAddress?: string
  lockedAt: Date
  releaseSchedule: {
    milestoneId: string
    amount: number
    releasedAt?: Date
    txId?: string
  }[]
}

export interface DisputeDetails {
  id: string
  reason: DisputeReason
  initiatedBy: 'funder' | 'lab' | 'system'
  evidenceLinks: string[]
  description: string
  createdAt: Date
  resolvedAt?: Date
  resolution?: 'funder_wins' | 'lab_wins' | 'partial_refund' | 'arbitration'
  slashAmount?: number
}

export interface BountyContext {
  bountyId: string
  funderId: string
  title: string
  description: string

  protocol: {
    methodology: string
    dataRequirements: string[]
    qualityStandards: string[]
    ethicsApproval?: string
  }

  totalBudget: number
  currency: 'USD' | 'USDC'
  paymentMethod?: PaymentMethod
  escrow?: EscrowDetails

  milestones: Milestone[]
  currentMilestoneIndex: number

  proposals: Proposal[]
  selectedLabId?: string
  selectedProposalId?: string

  dispute?: DisputeDetails

  openClawResult?: {
    traceId: string
    score: number
    decision: 'allow' | 'manual_review' | 'reject'
    requiresIRB: boolean
    requiresEthicsReview: boolean
    signals: Array<{ type: string; severity: string; message: string; rule?: string }>
    summary: string
  }
  adminReviewNote?: string
  adminReviewedBy?: string

  createdAt: Date
  openClawReviewedAt?: Date
  adminApprovedAt?: Date
  fundedAt?: Date
  startedAt?: Date
  completedAt?: Date

  error?: string
}

// ============================================================================
// Events
// ============================================================================

export type BountyEvent =
  | { type: 'SUBMIT_DRAFT'; protocol: BountyContext['protocol']; milestones: Milestone[] }
  | { type: 'OPENCLAW_COMPLETE'; result: NonNullable<BountyContext['openClawResult']> }
  | { type: 'INITIATE_FUNDING'; paymentMethod: PaymentMethod }
  | { type: 'FUNDING_CONFIRMED'; escrow: EscrowDetails }
  | { type: 'FUNDING_FAILED'; error: string }
  | { type: 'OPEN_BIDDING' }
  | { type: 'SUBMIT_PROPOSAL'; proposal: Proposal }
  | { type: 'SELECT_LAB'; proposalId: string }
  | { type: 'REJECT_ALL_PROPOSALS'; reason: string }
  | { type: 'START_RESEARCH' }
  | { type: 'SUBMIT_MILESTONE'; milestoneId: string; evidenceHash: string; evidenceLinks: string[] }
  | { type: 'APPROVE_MILESTONE'; milestoneId: string }
  | { type: 'REQUEST_REVISION'; milestoneId: string; feedback: string }
  | { type: 'INITIATE_DISPUTE'; reason: DisputeReason; description: string; evidenceLinks: string[] }
  | { type: 'RESOLVE_DISPUTE'; resolution: DisputeDetails['resolution']; slashAmount?: number }
  | { type: 'RELEASE_FINAL_PAYOUT' }
  | { type: 'CANCEL_BOUNTY'; reason: string }
  | { type: 'ADMIN_APPROVE_PROTOCOL'; reviewedBy: string; note?: string }
  | { type: 'ADMIN_REQUEST_CHANGES'; note: string }
  | { type: 'ADMIN_REJECT_PROTOCOL'; note: string }

// ============================================================================
// Guards
// ============================================================================

const guards = {
  isLastMilestone: ({ context }: { context: BountyContext }) =>
    context.currentMilestoneIndex >= context.milestones.length - 1,
}

// ============================================================================
// Actions
// ============================================================================

const actions = {
  assignProtocol: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'SUBMIT_DRAFT') return context
    return {
      ...context,
      protocol: event.protocol,
      milestones: event.milestones.map((m) => ({ ...m, revisionCount: 0 })),
    }
  }),

  setOpenClawResult: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'OPENCLAW_COMPLETE') return context
    return {
      ...context,
      openClawResult: event.result,
      openClawReviewedAt: new Date(),
    }
  }),

  setPaymentMethod: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'INITIATE_FUNDING') return context
    return { ...context, paymentMethod: event.paymentMethod }
  }),

  lockEscrow: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'FUNDING_CONFIRMED') return context
    return { ...context, escrow: event.escrow, fundedAt: new Date() }
  }),

  setFundingError: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'FUNDING_FAILED') return context
    return { ...context, error: event.error, paymentMethod: undefined }
  }),

  addProposal: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'SUBMIT_PROPOSAL') return context
    return { ...context, proposals: [...context.proposals, event.proposal] }
  }),

  selectLab: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'SELECT_LAB') return context
    const proposal = context.proposals.find((p) => p.id === event.proposalId)
    return {
      ...context,
      selectedProposalId: event.proposalId,
      selectedLabId: proposal?.labId,
    }
  }),

  startResearch: assign(({ context }: { context: BountyContext }) => ({
    ...context,
    startedAt: new Date(),
    milestones: context.milestones.map((m, i) =>
      i === 0 ? { ...m, status: 'in_progress' as const } : m
    ),
  })),

  submitMilestoneEvidence: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'SUBMIT_MILESTONE') return context
    return {
      ...context,
      milestones: context.milestones.map((m) =>
        m.id === event.milestoneId
          ? { ...m, evidenceHash: event.evidenceHash, status: 'submitted' as const }
          : m
      ),
    }
  }),

  approveMilestone: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'APPROVE_MILESTONE') return context
    const nextIndex = context.currentMilestoneIndex + 1
    return {
      ...context,
      milestones: context.milestones.map((m, i) => {
        if (m.id === event.milestoneId) return { ...m, status: 'verified' as const, verifiedAt: new Date() }
        if (i === nextIndex) return { ...m, status: 'in_progress' as const }
        return m
      }),
      currentMilestoneIndex: nextIndex,
    }
  }),

  rejectMilestone: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'REQUEST_REVISION') return context
    return {
      ...context,
      milestones: context.milestones.map((m) =>
        m.id === event.milestoneId
          ? { ...m, status: 'in_progress' as const, evidenceHash: undefined, revisionCount: m.revisionCount + 1 }
          : m
      ),
    }
  }),

  createDispute: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'INITIATE_DISPUTE') return context
    return {
      ...context,
      dispute: {
        id: randomUUID(),
        reason: event.reason,
        initiatedBy: 'funder' as const,
        evidenceLinks: event.evidenceLinks,
        description: event.description,
        createdAt: new Date(),
      },
    }
  }),

  resolveDispute: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'RESOLVE_DISPUTE' || !context.dispute) return context
    return {
      ...context,
      dispute: {
        ...context.dispute,
        resolvedAt: new Date(),
        resolution: event.resolution,
        slashAmount: event.slashAmount,
      },
    }
  }),

  completeBounty: assign(({ context }: { context: BountyContext }) => ({
    ...context,
    completedAt: new Date(),
  })),

  setAdminApproved: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'ADMIN_APPROVE_PROTOCOL') return context
    return {
      ...context,
      adminReviewedBy: event.reviewedBy,
      adminReviewNote: event.note,
      adminApprovedAt: new Date(),
    }
  }),

  setAdminRejected: assign(({ context, event }: { context: BountyContext; event: BountyEvent }) => {
    if (event.type !== 'ADMIN_REJECT_PROTOCOL' && event.type !== 'ADMIN_REQUEST_CHANGES') return context
    return {
      ...context,
      adminReviewNote: (event as { note: string }).note,
    }
  }),
}

// ============================================================================
// State Machine Definition
// ============================================================================

export const bountyMachine = createMachine(
  {
    id: 'bountyLifecycle',
    initial: 'drafting',
    context: {
      bountyId: '',
      funderId: '',
      title: '',
      description: '',
      protocol: { methodology: '', dataRequirements: [], qualityStandards: [] },
      totalBudget: 0,
      currency: 'USD',
      milestones: [],
      currentMilestoneIndex: 0,
      proposals: [],
      createdAt: new Date(),
    } as BountyContext,
    types: {} as { context: BountyContext; events: BountyEvent },

    states: {
      drafting: {
        on: {
          SUBMIT_DRAFT: { target: 'protocol_review', actions: 'assignProtocol' },
          CANCEL_BOUNTY: { target: 'cancelled' },
        },
      },

      protocol_review: {
        on: {
          OPENCLAW_COMPLETE: [
            {
              target: 'cancelled',
              guard: ({ event }) => event.type === 'OPENCLAW_COMPLETE' && event.result.decision === 'reject',
              actions: 'setOpenClawResult',
            },
            {
              target: 'admin_review',
              guard: ({ event }) => {
                if (event.type !== 'OPENCLAW_COMPLETE') return false
                return event.result.requiresIRB || event.result.requiresEthicsReview || event.result.decision === 'manual_review'
              },
              actions: 'setOpenClawResult',
            },
            {
              target: 'ready_for_funding',
              guard: ({ event }) => event.type === 'OPENCLAW_COMPLETE',
              actions: 'setOpenClawResult',
            },
          ],
          CANCEL_BOUNTY: { target: 'cancelled' },
        },
      },

      admin_review: {
        on: {
          ADMIN_APPROVE_PROTOCOL: { target: 'ready_for_funding', actions: 'setAdminApproved' },
          ADMIN_REQUEST_CHANGES: { target: 'drafting', actions: 'setAdminRejected' },
          ADMIN_REJECT_PROTOCOL: { target: 'cancelled', actions: 'setAdminRejected' },
        },
      },

      ready_for_funding: {
        on: {
          INITIATE_FUNDING: { target: 'funding_escrow', actions: 'setPaymentMethod' },
          CANCEL_BOUNTY: { target: 'cancelled' },
        },
      },

      funding_escrow: {
        initial: 'processing',
        states: {
          processing: {
            on: {
              FUNDING_CONFIRMED: { target: 'locked', actions: 'lockEscrow' },
              FUNDING_FAILED: { target: 'failed', actions: 'setFundingError' },
            },
          },
          locked: { type: 'final' },
          failed: {
            on: { INITIATE_FUNDING: { target: 'processing', actions: 'setPaymentMethod' } },
          },
        },
        onDone: { target: 'bidding' },
      },

      bidding: {
        initial: 'open',
        states: {
          open: {
            on: {
              SUBMIT_PROPOSAL: { actions: 'addProposal' },
              SELECT_LAB: { target: 'lab_selected', actions: 'selectLab' },
              REJECT_ALL_PROPOSALS: { target: 'no_valid_bids' },
            },
          },
          lab_selected: { type: 'final' },
          no_valid_bids: {
            on: { OPEN_BIDDING: { target: 'open' } },
          },
        },
        onDone: { target: 'active_research' },
        on: { CANCEL_BOUNTY: { target: 'refunding' } },
      },

      active_research: {
        entry: 'startResearch',
        on: {
          SUBMIT_MILESTONE: { target: 'milestone_review', actions: 'submitMilestoneEvidence' },
          INITIATE_DISPUTE: { target: 'dispute_resolution', actions: 'createDispute' },
        },
      },

      milestone_review: {
        on: {
          APPROVE_MILESTONE: [
            { target: 'completed_payout', guard: 'isLastMilestone', actions: 'approveMilestone' },
            { target: 'active_research', actions: 'approveMilestone' },
          ],
          REQUEST_REVISION: { target: 'active_research', actions: 'rejectMilestone' },
          INITIATE_DISPUTE: { target: 'dispute_resolution', actions: 'createDispute' },
        },
      },

      completed_payout: {
        entry: 'completeBounty',
        after: {
          86400000: { target: 'completed' },
        },
        on: { RELEASE_FINAL_PAYOUT: { target: 'completed' } },
      },

      dispute_resolution: {
        on: {
          RESOLVE_DISPUTE: [
            { target: 'completed_payout', guard: ({ event }) => event.resolution === 'lab_wins', actions: 'resolveDispute' },
            { target: 'refunding', guard: ({ event }) => event.resolution === 'funder_wins', actions: 'resolveDispute' },
            { target: 'partial_settlement', guard: ({ event }) => event.resolution === 'partial_refund', actions: 'resolveDispute' },
            { target: 'external_arbitration', guard: ({ event }) => event.resolution === 'arbitration', actions: 'resolveDispute' },
          ],
        },
      },

      external_arbitration: {
        on: {
          RESOLVE_DISPUTE: [
            { target: 'completed_payout', guard: ({ event }) => event.resolution === 'lab_wins', actions: 'resolveDispute' },
            { target: 'refunding', guard: ({ event }) => event.resolution === 'funder_wins', actions: 'resolveDispute' },
            { target: 'partial_settlement', actions: 'resolveDispute' },
          ],
        },
      },

      partial_settlement: { entry: 'completeBounty', type: 'final' },
      completed: { type: 'final' },
      refunding: { always: { target: 'cancelled' } },
      cancelled: { type: 'final' },
    },
  },
  { guards, actions }
)

export const stateMetadata: Record<
  string,
  { label: string; description: string; color: string; icon: string; allowedActions: string[] }
> = {
  drafting: { label: 'Drafting', description: 'Define research protocols and milestones', color: 'slate', icon: 'FileEdit', allowedActions: ['SUBMIT_DRAFT', 'CANCEL_BOUNTY'] },
  protocol_review: { label: 'Protocol Review', description: 'OpenClaw automated risk screening', color: 'amber', icon: 'FileCheck', allowedActions: [] },
  admin_review: { label: 'Admin Review', description: 'Ethics and safety review required', color: 'amber', icon: 'ShieldCheck', allowedActions: ['ADMIN_APPROVE_PROTOCOL', 'ADMIN_REQUEST_CHANGES', 'ADMIN_REJECT_PROTOCOL'] },
  ready_for_funding: { label: 'Ready for Funding', description: 'Protocol approved, awaiting escrow deposit', color: 'amber', icon: 'Wallet', allowedActions: ['INITIATE_FUNDING', 'CANCEL_BOUNTY'] },
  funding_escrow: { label: 'Funding Escrow', description: 'Funds being secured in escrow', color: 'amber', icon: 'Lock', allowedActions: ['FUNDING_CONFIRMED', 'FUNDING_FAILED'] },
  bidding: { label: 'Open for Bids', description: 'Verified labs submitting proposals', color: 'navy', icon: 'Users', allowedActions: ['SUBMIT_PROPOSAL', 'SELECT_LAB', 'CANCEL_BOUNTY'] },
  active_research: { label: 'Active Research', description: 'Lab conducting research', color: 'sage', icon: 'FlaskConical', allowedActions: ['SUBMIT_MILESTONE', 'INITIATE_DISPUTE'] },
  milestone_review: { label: 'Milestone Review', description: 'Verifying submitted deliverables', color: 'amber', icon: 'ClipboardCheck', allowedActions: ['APPROVE_MILESTONE', 'REQUEST_REVISION', 'INITIATE_DISPUTE'] },
  dispute_resolution: { label: 'Dispute Resolution', description: 'Investigating potential fraud or breach', color: 'destructive', icon: 'AlertTriangle', allowedActions: ['RESOLVE_DISPUTE'] },
  external_arbitration: { label: 'External Arbitration', description: 'Case escalated to arbitrator', color: 'destructive', icon: 'Scale', allowedActions: ['RESOLVE_DISPUTE'] },
  partial_settlement: { label: 'Partial Settlement', description: 'Dispute resolved with split funds', color: 'amber', icon: 'Split', allowedActions: [] },
  completed_payout: { label: 'Payout Processing', description: 'Releasing funds to lab', color: 'sage', icon: 'CircleDollarSign', allowedActions: ['RELEASE_FINAL_PAYOUT'] },
  completed: { label: 'Completed', description: 'Research complete, funds released', color: 'sage', icon: 'CheckCircle2', allowedActions: [] },
  refunding: { label: 'Refunding', description: 'Returning funds to funder', color: 'slate', icon: 'Undo2', allowedActions: [] },
  cancelled: { label: 'Cancelled', description: 'Bounty cancelled or terminated', color: 'slate', icon: 'XCircle', allowedActions: [] },
}

export type BountyState = keyof typeof stateMetadata
