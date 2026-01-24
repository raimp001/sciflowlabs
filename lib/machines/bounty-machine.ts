/**
 * SciFlow Bounty Lifecycle State Machine
 * 
 * This XState machine governs the entire lifecycle of a research bounty,
 * from initial drafting through completion or dispute resolution.
 * 
 * Key Design Principles:
 * - Immutable state transitions (no skipping states)
 * - Guard conditions prevent invalid state transitions
 * - All financial operations are atomic
 * - Dispute resolution is a terminal branch that requires manual resolution
 */

import { assign, createMachine, type MachineContext } from 'xstate';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type PaymentMethod = 'stripe' | 'solana_usdc' | 'base_usdc';
export type LabVerificationTier = 'unverified' | 'basic' | 'verified' | 'trusted' | 'institutional';
export type DisputeReason = 
  | 'data_falsification' 
  | 'protocol_deviation' 
  | 'sample_tampering' 
  | 'timeline_breach' 
  | 'quality_failure'
  | 'communication_failure';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
  payoutPercentage: number;
  dueDate: Date;
  evidenceHash?: string;
  verifiedAt?: Date;
  status: 'pending' | 'in_progress' | 'submitted' | 'verified' | 'rejected';
}

export interface Proposal {
  id: string;
  labId: string;
  labName: string;
  verificationTier: LabVerificationTier;
  methodology: string;
  timeline: number; // days
  bidAmount: number;
  stakedAmount: number;
  submittedAt: Date;
  attachments: string[];
}

export interface EscrowDetails {
  method: PaymentMethod;
  totalAmount: number;
  currency: 'USD' | 'USDC';
  stripePaymentIntentId?: string;
  solanaEscrowPDA?: string;
  baseContractAddress?: string;
  lockedAt: Date;
  releaseSchedule: {
    milestoneId: string;
    amount: number;
    releasedAt?: Date;
  }[];
}

export interface DisputeDetails {
  id: string;
  reason: DisputeReason;
  initiatedBy: 'funder' | 'lab';
  evidenceLinks: string[];
  description: string;
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: 'funder_wins' | 'lab_wins' | 'partial_refund' | 'arbitration';
  slashAmount?: number;
}

export interface BountyContext {
  // Core identifiers
  bountyId: string;
  funderId: string;
  title: string;
  description: string;
  
  // Protocol & requirements
  protocol: {
    methodology: string;
    dataRequirements: string[];
    qualityStandards: string[];
    ethicsApproval?: string;
  };
  
  // Financial
  totalBudget: number;
  currency: 'USD' | 'USDC';
  paymentMethod?: PaymentMethod;
  escrow?: EscrowDetails;
  
  // Milestones
  milestones: Milestone[];
  currentMilestoneIndex: number;
  
  // Bidding & Assignment
  proposals: Proposal[];
  selectedLabId?: string;
  selectedProposalId?: string;
  
  // Dispute
  dispute?: DisputeDetails;
  
  // Timestamps
  createdAt: Date;
  fundedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Error handling
  error?: string;
}

// ============================================================================
// Events
// ============================================================================

export type BountyEvent =
  | { type: 'SUBMIT_DRAFT'; protocol: BountyContext['protocol']; milestones: Milestone[] }
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
  | { type: 'CANCEL_BOUNTY'; reason: string };

// ============================================================================
// Guards
// ============================================================================

const guards = {
  hasValidProtocol: ({ context }: { context: BountyContext }) => {
    return Boolean(
      context.protocol?.methodology &&
      context.protocol?.dataRequirements?.length > 0 &&
      context.milestones?.length > 0
    );
  },

  hasFundingDetails: ({ context }: { context: BountyContext }) => {
    return Boolean(context.paymentMethod && context.totalBudget > 0);
  },

  hasProposals: ({ context }: { context: BountyContext }) => {
    return context.proposals.length > 0;
  },

  hasSelectedLab: ({ context }: { context: BountyContext }) => {
    return Boolean(context.selectedLabId && context.selectedProposalId);
  },

  isLabVerified: ({ context }: { context: BountyContext }) => {
    const selectedProposal = context.proposals.find(p => p.id === context.selectedProposalId);
    return selectedProposal?.verificationTier !== 'unverified';
  },

  hasCurrentMilestoneEvidence: ({ context }: { context: BountyContext }) => {
    const currentMilestone = context.milestones[context.currentMilestoneIndex];
    return currentMilestone?.status === 'submitted' && Boolean(currentMilestone.evidenceHash);
  },

  isLastMilestone: ({ context }: { context: BountyContext }) => {
    return context.currentMilestoneIndex >= context.milestones.length - 1;
  },

  canSlashStake: ({ context }: { context: BountyContext }) => {
    const selectedProposal = context.proposals.find(p => p.id === context.selectedProposalId);
    return Boolean(selectedProposal?.stakedAmount && selectedProposal.stakedAmount > 0);
  },

  escrowIsLocked: ({ context }: { context: BountyContext }) => {
    return Boolean(context.escrow?.lockedAt);
  },
};

// ============================================================================
// Actions
// ============================================================================

const actions = {
  assignProtocol: assign(({ context, event }) => {
    if (event.type !== 'SUBMIT_DRAFT') return context;
    return {
      ...context,
      protocol: event.protocol,
      milestones: event.milestones,
    };
  }),

  setPaymentMethod: assign(({ context, event }) => {
    if (event.type !== 'INITIATE_FUNDING') return context;
    return {
      ...context,
      paymentMethod: event.paymentMethod,
    };
  }),

  lockEscrow: assign(({ context, event }) => {
    if (event.type !== 'FUNDING_CONFIRMED') return context;
    return {
      ...context,
      escrow: event.escrow,
      fundedAt: new Date(),
    };
  }),

  setFundingError: assign(({ context, event }) => {
    if (event.type !== 'FUNDING_FAILED') return context;
    return {
      ...context,
      error: event.error,
      paymentMethod: undefined,
    };
  }),

  addProposal: assign(({ context, event }) => {
    if (event.type !== 'SUBMIT_PROPOSAL') return context;
    return {
      ...context,
      proposals: [...context.proposals, event.proposal],
    };
  }),

  selectLab: assign(({ context, event }) => {
    if (event.type !== 'SELECT_LAB') return context;
    const proposal = context.proposals.find(p => p.id === event.proposalId);
    return {
      ...context,
      selectedProposalId: event.proposalId,
      selectedLabId: proposal?.labId,
    };
  }),

  startResearch: assign(({ context }) => ({
    ...context,
    startedAt: new Date(),
    milestones: context.milestones.map((m, i) => 
      i === 0 ? { ...m, status: 'in_progress' as const } : m
    ),
  })),

  submitMilestoneEvidence: assign(({ context, event }) => {
    if (event.type !== 'SUBMIT_MILESTONE') return context;
    return {
      ...context,
      milestones: context.milestones.map(m => 
        m.id === event.milestoneId 
          ? { ...m, evidenceHash: event.evidenceHash, status: 'submitted' as const }
          : m
      ),
    };
  }),

  approveMilestone: assign(({ context, event }) => {
    if (event.type !== 'APPROVE_MILESTONE') return context;
    const nextIndex = context.currentMilestoneIndex + 1;
    return {
      ...context,
      milestones: context.milestones.map((m, i) => {
        if (m.id === event.milestoneId) {
          return { ...m, status: 'verified' as const, verifiedAt: new Date() };
        }
        if (i === nextIndex) {
          return { ...m, status: 'in_progress' as const };
        }
        return m;
      }),
      currentMilestoneIndex: nextIndex,
    };
  }),

  rejectMilestone: assign(({ context, event }) => {
    if (event.type !== 'REQUEST_REVISION') return context;
    return {
      ...context,
      milestones: context.milestones.map(m => 
        m.id === event.milestoneId
          ? { ...m, status: 'in_progress' as const, evidenceHash: undefined }
          : m
      ),
    };
  }),

  createDispute: assign(({ context, event }) => {
    if (event.type !== 'INITIATE_DISPUTE') return context;
    return {
      ...context,
      dispute: {
        id: `dispute_${Date.now()}`,
        reason: event.reason,
        initiatedBy: 'funder',
        evidenceLinks: event.evidenceLinks,
        description: event.description,
        createdAt: new Date(),
      },
    };
  }),

  resolveDispute: assign(({ context, event }) => {
    if (event.type !== 'RESOLVE_DISPUTE' || !context.dispute) return context;
    return {
      ...context,
      dispute: {
        ...context.dispute,
        resolvedAt: new Date(),
        resolution: event.resolution,
        slashAmount: event.slashAmount,
      },
    };
  }),

  completeBounty: assign(({ context }) => ({
    ...context,
    completedAt: new Date(),
  })),
};

// ============================================================================
// State Machine Definition
// ============================================================================

export const bountyMachine = createMachine({
  id: 'bountyLifecycle',
  initial: 'drafting',
  context: {
    bountyId: '',
    funderId: '',
    title: '',
    description: '',
    protocol: {
      methodology: '',
      dataRequirements: [],
      qualityStandards: [],
    },
    totalBudget: 0,
    currency: 'USD',
    milestones: [],
    currentMilestoneIndex: 0,
    proposals: [],
    createdAt: new Date(),
  } as BountyContext,
  types: {} as {
    context: BountyContext;
    events: BountyEvent;
  },

  states: {
    /**
     * DRAFTING
     * Initial state where the funder defines research protocols,
     * milestones, deliverables, and budget allocation.
     */
    drafting: {
      on: {
        SUBMIT_DRAFT: {
          target: 'protocol_review',
          actions: 'assignProtocol',
        },
        CANCEL_BOUNTY: {
          target: 'cancelled',
        },
      },
    },

    /**
     * PROTOCOL_REVIEW
     * Intermediate validation state before funding.
     * Ensures all required fields are complete.
     */
    protocol_review: {
      always: [
        {
          target: 'ready_for_funding',
          guard: 'hasValidProtocol',
        },
        {
          target: 'drafting',
        },
      ],
    },

    /**
     * READY_FOR_FUNDING
     * Protocol approved, awaiting funder's payment.
     */
    ready_for_funding: {
      on: {
        INITIATE_FUNDING: {
          target: 'funding_escrow',
          actions: 'setPaymentMethod',
        },
        CANCEL_BOUNTY: {
          target: 'cancelled',
        },
      },
    },

    /**
     * FUNDING_ESCROW
     * Funds are being locked in escrow.
     * This is the critical financial state.
     */
    funding_escrow: {
      initial: 'processing',
      states: {
        processing: {
          on: {
            FUNDING_CONFIRMED: {
              target: 'locked',
              actions: 'lockEscrow',
            },
            FUNDING_FAILED: {
              target: 'failed',
              actions: 'setFundingError',
            },
          },
        },
        locked: {
          type: 'final',
        },
        failed: {
          on: {
            INITIATE_FUNDING: {
              target: 'processing',
              actions: 'setPaymentMethod',
            },
          },
        },
      },
      onDone: {
        target: 'bidding',
      },
    },

    /**
     * BIDDING
     * Open for verified labs to submit proposals.
     * Funder reviews and selects the winning bid.
     */
    bidding: {
      initial: 'open',
      states: {
        open: {
          on: {
            SUBMIT_PROPOSAL: {
              actions: 'addProposal',
            },
            SELECT_LAB: [
              {
                target: 'lab_selected',
                guard: 'hasProposals',
                actions: 'selectLab',
              },
            ],
            REJECT_ALL_PROPOSALS: {
              target: 'no_valid_bids',
            },
          },
        },
        lab_selected: {
          type: 'final',
        },
        no_valid_bids: {
          on: {
            OPEN_BIDDING: {
              target: 'open',
            },
          },
        },
      },
      onDone: {
        target: 'active_research',
      },
      on: {
        CANCEL_BOUNTY: {
          target: 'refunding',
        },
      },
    },

    /**
     * ACTIVE_RESEARCH
     * Lab is conducting research.
     * Work proceeds through milestones.
     */
    active_research: {
      entry: 'startResearch',
      on: {
        SUBMIT_MILESTONE: {
          target: 'milestone_review',
          actions: 'submitMilestoneEvidence',
        },
        INITIATE_DISPUTE: {
          target: 'dispute_resolution',
          actions: 'createDispute',
        },
      },
    },

    /**
     * MILESTONE_REVIEW
     * Funder reviews submitted evidence.
     * Can approve, request revisions, or escalate to dispute.
     */
    milestone_review: {
      on: {
        APPROVE_MILESTONE: [
          {
            target: 'completed_payout',
            guard: 'isLastMilestone',
            actions: 'approveMilestone',
          },
          {
            target: 'active_research',
            actions: 'approveMilestone',
          },
        ],
        REQUEST_REVISION: {
          target: 'active_research',
          actions: 'rejectMilestone',
        },
        INITIATE_DISPUTE: {
          target: 'dispute_resolution',
          actions: 'createDispute',
        },
      },
    },

    /**
     * DISPUTE_RESOLUTION
     * Triggered when fraud is suspected.
     * Freezes funds and invokes arbitration.
     * Can result in stake slashing.
     */
    dispute_resolution: {
      on: {
        RESOLVE_DISPUTE: [
          {
            target: 'completed_payout',
            guard: ({ event }) => event.resolution === 'lab_wins',
            actions: 'resolveDispute',
          },
          {
            target: 'refunding',
            guard: ({ event }) => event.resolution === 'funder_wins',
            actions: 'resolveDispute',
          },
          {
            target: 'partial_settlement',
            guard: ({ event }) => event.resolution === 'partial_refund',
            actions: 'resolveDispute',
          },
          {
            target: 'external_arbitration',
            guard: ({ event }) => event.resolution === 'arbitration',
            actions: 'resolveDispute',
          },
        ],
      },
    },

    /**
     * EXTERNAL_ARBITRATION
     * Case escalated to external arbitrator.
     * Awaits binding resolution.
     */
    external_arbitration: {
      on: {
        RESOLVE_DISPUTE: [
          {
            target: 'completed_payout',
            guard: ({ event }) => event.resolution === 'lab_wins',
            actions: 'resolveDispute',
          },
          {
            target: 'refunding',
            guard: ({ event }) => event.resolution === 'funder_wins',
            actions: 'resolveDispute',
          },
          {
            target: 'partial_settlement',
            actions: 'resolveDispute',
          },
        ],
      },
    },

    /**
     * PARTIAL_SETTLEMENT
     * Dispute resolved with split funds.
     */
    partial_settlement: {
      entry: 'completeBounty',
      type: 'final',
    },

    /**
     * COMPLETED_PAYOUT
     * All milestones verified.
     * Full payment released to lab.
     */
    completed_payout: {
      entry: 'completeBounty',
      on: {
        RELEASE_FINAL_PAYOUT: {
          target: 'completed',
        },
      },
    },

    /**
     * COMPLETED
     * Terminal success state.
     */
    completed: {
      type: 'final',
    },

    /**
     * REFUNDING
     * Funds being returned to funder.
     * May include stake slashing from lab.
     */
    refunding: {
      always: {
        target: 'cancelled',
      },
    },

    /**
     * CANCELLED
     * Terminal failure/cancellation state.
     */
    cancelled: {
      type: 'final',
    },
  },
}, {
  guards,
  actions,
});

// ============================================================================
// State Metadata (for UI rendering)
// ============================================================================

export const stateMetadata: Record<string, {
  label: string;
  description: string;
  color: string;
  icon: string;
  allowedActions: string[];
}> = {
  drafting: {
    label: 'Drafting',
    description: 'Define research protocols and milestones',
    color: 'slate',
    icon: 'FileEdit',
    allowedActions: ['SUBMIT_DRAFT', 'CANCEL_BOUNTY'],
  },
  protocol_review: {
    label: 'Protocol Review',
    description: 'Validating protocol requirements',
    color: 'amber',
    icon: 'FileCheck',
    allowedActions: [],
  },
  ready_for_funding: {
    label: 'Ready for Funding',
    description: 'Protocol approved, awaiting escrow deposit',
    color: 'amber',
    icon: 'Wallet',
    allowedActions: ['INITIATE_FUNDING', 'CANCEL_BOUNTY'],
  },
  funding_escrow: {
    label: 'Funding Escrow',
    description: 'Funds being secured in escrow',
    color: 'amber',
    icon: 'Lock',
    allowedActions: ['FUNDING_CONFIRMED', 'FUNDING_FAILED'],
  },
  bidding: {
    label: 'Open for Bids',
    description: 'Verified labs submitting proposals',
    color: 'navy',
    icon: 'Users',
    allowedActions: ['SUBMIT_PROPOSAL', 'SELECT_LAB', 'CANCEL_BOUNTY'],
  },
  active_research: {
    label: 'Active Research',
    description: 'Lab conducting research',
    color: 'sage',
    icon: 'FlaskConical',
    allowedActions: ['SUBMIT_MILESTONE', 'INITIATE_DISPUTE'],
  },
  milestone_review: {
    label: 'Milestone Review',
    description: 'Verifying submitted deliverables',
    color: 'amber',
    icon: 'ClipboardCheck',
    allowedActions: ['APPROVE_MILESTONE', 'REQUEST_REVISION', 'INITIATE_DISPUTE'],
  },
  dispute_resolution: {
    label: 'Dispute Resolution',
    description: 'Investigating potential fraud or breach',
    color: 'destructive',
    icon: 'AlertTriangle',
    allowedActions: ['RESOLVE_DISPUTE'],
  },
  external_arbitration: {
    label: 'External Arbitration',
    description: 'Case escalated to arbitrator',
    color: 'destructive',
    icon: 'Scale',
    allowedActions: ['RESOLVE_DISPUTE'],
  },
  partial_settlement: {
    label: 'Partial Settlement',
    description: 'Dispute resolved with split funds',
    color: 'amber',
    icon: 'Split',
    allowedActions: [],
  },
  completed_payout: {
    label: 'Payout Processing',
    description: 'Releasing funds to lab',
    color: 'sage',
    icon: 'CircleDollarSign',
    allowedActions: ['RELEASE_FINAL_PAYOUT'],
  },
  completed: {
    label: 'Completed',
    description: 'Research complete, funds released',
    color: 'sage',
    icon: 'CheckCircle2',
    allowedActions: [],
  },
  refunding: {
    label: 'Refunding',
    description: 'Returning funds to funder',
    color: 'slate',
    icon: 'Undo2',
    allowedActions: [],
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Bounty cancelled or terminated',
    color: 'slate',
    icon: 'XCircle',
    allowedActions: [],
  },
};

export type BountyState = keyof typeof stateMetadata;
