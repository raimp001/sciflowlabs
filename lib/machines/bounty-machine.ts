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

export type RejectionReason =
  | 'dangerous_research'
  | 'unethical_content'
  | 'illegal_activity'
  | 'insufficient_detail'
  | 'unrealistic_budget'
  | 'spam_or_fraud'
  | 'duplicate_bounty'
  | 'other';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ContentFlags {
  hasDangerousKeywords: boolean;
  hasEthicalConcerns: boolean;
  hasUnrealisticExpectations: boolean;
  riskLevel: RiskLevel;
  flaggedTerms: string[];
  moderationNotes?: string;
}

export interface AdminReview {
  reviewerId: string;
  reviewerName: string;
  status: 'pending' | 'approved' | 'rejected' | 'requires_changes';
  reviewedAt?: Date;
  notes?: string;
  rejectionReason?: RejectionReason;
  contentFlags: ContentFlags;
  requiredChanges?: string[];
}

export interface ResearchDeadline {
  startDate: Date;
  deadlineDate: Date;
  maxDurationDays: number;
  extensionsGranted: number;
  maxExtensions: number;
  warningThresholdDays: number;
  isOverdue: boolean;
  lastExtensionReason?: string;
}

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
  biddingDeadline?: Date;
  proposalAcceptedAt?: Date;

  // Admin Review & Moderation
  adminReview?: AdminReview;
  contentFlags?: ContentFlags;

  // Research Deadline Management
  researchDeadline?: ResearchDeadline;

  // Dispute
  dispute?: DisputeDetails;

  // Timestamps
  createdAt: Date;
  submittedForReviewAt?: Date;
  approvedAt?: Date;
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
  | { type: 'SUBMIT_FOR_REVIEW'; contentFlags: ContentFlags }
  | { type: 'ADMIN_APPROVE'; reviewerId: string; reviewerName: string; notes?: string }
  | { type: 'ADMIN_REJECT'; reviewerId: string; reviewerName: string; reason: RejectionReason; notes?: string }
  | { type: 'ADMIN_REQUEST_CHANGES'; reviewerId: string; reviewerName: string; requiredChanges: string[]; notes?: string }
  | { type: 'RESUBMIT_FOR_REVIEW'; contentFlags: ContentFlags }
  | { type: 'INITIATE_FUNDING'; paymentMethod: PaymentMethod }
  | { type: 'FUNDING_CONFIRMED'; escrow: EscrowDetails }
  | { type: 'FUNDING_FAILED'; error: string }
  | { type: 'OPEN_BIDDING'; biddingDeadline: Date }
  | { type: 'SUBMIT_PROPOSAL'; proposal: Proposal }
  | { type: 'ACCEPT_PROPOSAL'; proposalId: string; researchDeadlineDays: number }
  | { type: 'SELECT_LAB'; proposalId: string }
  | { type: 'REJECT_ALL_PROPOSALS'; reason: string }
  | { type: 'BIDDING_EXPIRED' }
  | { type: 'START_RESEARCH' }
  | { type: 'SUBMIT_MILESTONE'; milestoneId: string; evidenceHash: string; evidenceLinks: string[] }
  | { type: 'APPROVE_MILESTONE'; milestoneId: string }
  | { type: 'REQUEST_REVISION'; milestoneId: string; feedback: string }
  | { type: 'REQUEST_EXTENSION'; reason: string; additionalDays: number }
  | { type: 'GRANT_EXTENSION'; additionalDays: number }
  | { type: 'DENY_EXTENSION'; reason: string }
  | { type: 'DEADLINE_EXPIRED' }
  | { type: 'INITIATE_DISPUTE'; reason: DisputeReason; description: string; evidenceLinks: string[] }
  | { type: 'RESOLVE_DISPUTE'; resolution: DisputeDetails['resolution']; slashAmount?: number }
  | { type: 'RELEASE_FINAL_PAYOUT' }
  | { type: 'CANCEL_BOUNTY'; reason: string };

// ============================================================================
// Guards
// ============================================================================

// ============================================================================
// Dangerous/Prohibited Content Keywords (Guardrails)
// ============================================================================

const DANGEROUS_KEYWORDS = [
  // Weapons & explosives
  'bioweapon', 'chemical weapon', 'nerve agent', 'explosive synthesis',
  'nuclear weapon', 'dirty bomb', 'poison gas', 'anthrax', 'ricin',
  // Harmful substances
  'synthesize drugs', 'manufacture narcotics', 'create toxins',
  'deadly pathogen', 'engineered virus', 'gain of function',
  // Illegal activities
  'money laundering', 'human trafficking', 'child exploitation',
  // Dangerous experiments
  'human cloning', 'unethical human trials', 'without consent',
];

const ETHICAL_CONCERN_KEYWORDS = [
  'animal cruelty', 'endangered species', 'no ethics approval',
  'bypass regulations', 'avoid oversight', 'secret research',
  'unauthorized experiments', 'military application',
];

export function analyzeContent(title: string, description: string, methodology: string): ContentFlags {
  const combinedText = `${title} ${description} ${methodology}`.toLowerCase();
  const flaggedTerms: string[] = [];

  const hasDangerousKeywords = DANGEROUS_KEYWORDS.some(keyword => {
    if (combinedText.includes(keyword.toLowerCase())) {
      flaggedTerms.push(keyword);
      return true;
    }
    return false;
  });

  const hasEthicalConcerns = ETHICAL_CONCERN_KEYWORDS.some(keyword => {
    if (combinedText.includes(keyword.toLowerCase())) {
      flaggedTerms.push(keyword);
      return true;
    }
    return false;
  });

  // Detect unrealistic expectations
  const unrealisticPatterns = [
    /cure.*(?:all|every|any).*(?:disease|cancer|illness)/i,
    /100%.*(?:guaranteed|success|effective)/i,
    /(?:impossible|miracle|magic)/i,
    /(?:overnight|instant).*(?:results|solution|cure)/i,
  ];

  const hasUnrealisticExpectations = unrealisticPatterns.some(pattern => {
    if (pattern.test(combinedText)) {
      flaggedTerms.push('unrealistic claims');
      return true;
    }
    return false;
  });

  // Calculate risk level
  let riskLevel: RiskLevel = 'low';
  if (hasDangerousKeywords) {
    riskLevel = 'critical';
  } else if (hasEthicalConcerns) {
    riskLevel = 'high';
  } else if (hasUnrealisticExpectations) {
    riskLevel = 'medium';
  }

  return {
    hasDangerousKeywords,
    hasEthicalConcerns,
    hasUnrealisticExpectations,
    riskLevel,
    flaggedTerms,
  };
}

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

  // Admin Review Guards
  isAdminApproved: ({ context }: { context: BountyContext }) => {
    return context.adminReview?.status === 'approved';
  },

  isNotCriticalRisk: ({ context }: { context: BountyContext }) => {
    return context.contentFlags?.riskLevel !== 'critical';
  },

  hasContentFlags: ({ context }: { context: BountyContext }) => {
    return Boolean(context.contentFlags);
  },

  // Deadline Guards
  canGrantExtension: ({ context }: { context: BountyContext }) => {
    const deadline = context.researchDeadline;
    if (!deadline) return false;
    return deadline.extensionsGranted < deadline.maxExtensions;
  },

  isDeadlineExpired: ({ context }: { context: BountyContext }) => {
    const deadline = context.researchDeadline;
    if (!deadline) return false;
    return new Date() > deadline.deadlineDate;
  },

  // Bidding Guards
  isBiddingOpen: ({ context }: { context: BountyContext }) => {
    if (!context.biddingDeadline) return true;
    return new Date() < context.biddingDeadline;
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

  // Admin Review Actions
  submitForReview: assign(({ context, event }) => {
    if (event.type !== 'SUBMIT_FOR_REVIEW' && event.type !== 'RESUBMIT_FOR_REVIEW') return context;
    return {
      ...context,
      submittedForReviewAt: new Date(),
      contentFlags: event.contentFlags,
      adminReview: {
        reviewerId: '',
        reviewerName: '',
        status: 'pending' as const,
        contentFlags: event.contentFlags,
      },
    };
  }),

  adminApprove: assign(({ context, event }) => {
    if (event.type !== 'ADMIN_APPROVE') return context;
    return {
      ...context,
      approvedAt: new Date(),
      adminReview: {
        ...context.adminReview!,
        reviewerId: event.reviewerId,
        reviewerName: event.reviewerName,
        status: 'approved' as const,
        reviewedAt: new Date(),
        notes: event.notes,
      },
    };
  }),

  adminReject: assign(({ context, event }) => {
    if (event.type !== 'ADMIN_REJECT') return context;
    return {
      ...context,
      adminReview: {
        ...context.adminReview!,
        reviewerId: event.reviewerId,
        reviewerName: event.reviewerName,
        status: 'rejected' as const,
        reviewedAt: new Date(),
        rejectionReason: event.reason,
        notes: event.notes,
      },
    };
  }),

  adminRequestChanges: assign(({ context, event }) => {
    if (event.type !== 'ADMIN_REQUEST_CHANGES') return context;
    return {
      ...context,
      adminReview: {
        ...context.adminReview!,
        reviewerId: event.reviewerId,
        reviewerName: event.reviewerName,
        status: 'requires_changes' as const,
        reviewedAt: new Date(),
        requiredChanges: event.requiredChanges,
        notes: event.notes,
      },
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

  // Bidding Actions
  openBidding: assign(({ context, event }) => {
    if (event.type !== 'OPEN_BIDDING') return context;
    return {
      ...context,
      biddingDeadline: event.biddingDeadline,
    };
  }),

  addProposal: assign(({ context, event }) => {
    if (event.type !== 'SUBMIT_PROPOSAL') return context;
    return {
      ...context,
      proposals: [...context.proposals, event.proposal],
    };
  }),

  acceptProposal: assign(({ context, event }) => {
    if (event.type !== 'ACCEPT_PROPOSAL') return context;
    const proposal = context.proposals.find(p => p.id === event.proposalId);
    const startDate = new Date();
    const deadlineDate = new Date(startDate);
    deadlineDate.setDate(deadlineDate.getDate() + event.researchDeadlineDays);

    return {
      ...context,
      selectedProposalId: event.proposalId,
      selectedLabId: proposal?.labId,
      proposalAcceptedAt: new Date(),
      researchDeadline: {
        startDate,
        deadlineDate,
        maxDurationDays: event.researchDeadlineDays,
        extensionsGranted: 0,
        maxExtensions: 2,
        warningThresholdDays: 7,
        isOverdue: false,
      },
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

  // Research & Deadline Actions
  startResearch: assign(({ context }) => ({
    ...context,
    startedAt: new Date(),
    milestones: context.milestones.map((m, i) =>
      i === 0 ? { ...m, status: 'in_progress' as const } : m
    ),
  })),

  grantExtension: assign(({ context, event }) => {
    if (event.type !== 'GRANT_EXTENSION' || !context.researchDeadline) return context;
    const newDeadline = new Date(context.researchDeadline.deadlineDate);
    newDeadline.setDate(newDeadline.getDate() + event.additionalDays);

    return {
      ...context,
      researchDeadline: {
        ...context.researchDeadline,
        deadlineDate: newDeadline,
        extensionsGranted: context.researchDeadline.extensionsGranted + 1,
        isOverdue: false,
      },
    };
  }),

  markDeadlineExpired: assign(({ context }) => {
    if (!context.researchDeadline) return context;
    return {
      ...context,
      researchDeadline: {
        ...context.researchDeadline,
        isOverdue: true,
      },
    };
  }),

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
     * Intermediate validation state before admin review.
     * Ensures all required fields are complete.
     */
    protocol_review: {
      always: [
        {
          target: 'pending_admin_review',
          guard: 'hasValidProtocol',
        },
        {
          target: 'drafting',
        },
      ],
    },

    /**
     * PENDING_ADMIN_REVIEW
     * Bounty submitted for admin moderation.
     * Admin checks for dangerous, unethical, or unrealistic content.
     */
    pending_admin_review: {
      on: {
        SUBMIT_FOR_REVIEW: {
          actions: 'submitForReview',
        },
        ADMIN_APPROVE: {
          target: 'ready_for_funding',
          actions: 'adminApprove',
          guard: 'isNotCriticalRisk',
        },
        ADMIN_REJECT: {
          target: 'rejected',
          actions: 'adminReject',
        },
        ADMIN_REQUEST_CHANGES: {
          target: 'requires_changes',
          actions: 'adminRequestChanges',
        },
        CANCEL_BOUNTY: {
          target: 'cancelled',
        },
      },
    },

    /**
     * REQUIRES_CHANGES
     * Admin has requested modifications before approval.
     * Funder must address the concerns and resubmit.
     */
    requires_changes: {
      on: {
        SUBMIT_DRAFT: {
          target: 'protocol_review',
          actions: 'assignProtocol',
        },
        RESUBMIT_FOR_REVIEW: {
          target: 'pending_admin_review',
          actions: 'submitForReview',
        },
        CANCEL_BOUNTY: {
          target: 'cancelled',
        },
      },
    },

    /**
     * REJECTED
     * Admin has permanently rejected the bounty.
     * Reasons include dangerous research, unethical content, etc.
     */
    rejected: {
      type: 'final',
    },

    /**
     * READY_FOR_FUNDING
     * Admin approved, awaiting funder's payment.
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
     * First lab to be accepted gets the bounty (first-come-first-served).
     * Has a deadline for proposal submissions.
     */
    bidding: {
      initial: 'open',
      states: {
        open: {
          on: {
            OPEN_BIDDING: {
              actions: 'openBidding',
            },
            SUBMIT_PROPOSAL: {
              actions: 'addProposal',
              guard: 'isBiddingOpen',
            },
            ACCEPT_PROPOSAL: [
              {
                target: 'lab_selected',
                guard: 'hasProposals',
                actions: 'acceptProposal',
              },
            ],
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
            BIDDING_EXPIRED: {
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
              actions: 'openBidding',
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
     * Lab is conducting research with a deadline.
     * Work proceeds through milestones.
     * Extensions can be requested (up to max limit).
     */
    active_research: {
      entry: 'startResearch',
      on: {
        SUBMIT_MILESTONE: {
          target: 'milestone_review',
          actions: 'submitMilestoneEvidence',
        },
        REQUEST_EXTENSION: {
          target: 'extension_review',
        },
        DEADLINE_EXPIRED: {
          target: 'deadline_breach',
          actions: 'markDeadlineExpired',
        },
        INITIATE_DISPUTE: {
          target: 'dispute_resolution',
          actions: 'createDispute',
        },
      },
    },

    /**
     * EXTENSION_REVIEW
     * Lab has requested a deadline extension.
     * Funder decides whether to grant additional time.
     */
    extension_review: {
      on: {
        GRANT_EXTENSION: {
          target: 'active_research',
          actions: 'grantExtension',
          guard: 'canGrantExtension',
        },
        DENY_EXTENSION: {
          target: 'active_research',
        },
        INITIATE_DISPUTE: {
          target: 'dispute_resolution',
          actions: 'createDispute',
        },
      },
    },

    /**
     * DEADLINE_BREACH
     * Lab has exceeded the research deadline.
     * Funder can initiate dispute or grant final extension.
     */
    deadline_breach: {
      on: {
        GRANT_EXTENSION: {
          target: 'active_research',
          actions: 'grantExtension',
          guard: 'canGrantExtension',
        },
        INITIATE_DISPUTE: {
          target: 'dispute_resolution',
          actions: 'createDispute',
        },
        SUBMIT_MILESTONE: {
          target: 'milestone_review',
          actions: 'submitMilestoneEvidence',
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
  requiresAdmin?: boolean;
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
  pending_admin_review: {
    label: 'Pending Admin Review',
    description: 'Awaiting moderation for safety and legitimacy',
    color: 'coral',
    icon: 'Shield',
    allowedActions: ['ADMIN_APPROVE', 'ADMIN_REJECT', 'ADMIN_REQUEST_CHANGES'],
    requiresAdmin: true,
  },
  requires_changes: {
    label: 'Changes Required',
    description: 'Admin requested modifications before approval',
    color: 'amber',
    icon: 'PenLine',
    allowedActions: ['SUBMIT_DRAFT', 'RESUBMIT_FOR_REVIEW', 'CANCEL_BOUNTY'],
  },
  rejected: {
    label: 'Rejected',
    description: 'Bounty rejected due to policy violation',
    color: 'destructive',
    icon: 'ShieldX',
    allowedActions: [],
  },
  ready_for_funding: {
    label: 'Ready for Funding',
    description: 'Admin approved, awaiting escrow deposit',
    color: 'sage',
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
    description: 'Labs submitting proposals (first accepted wins)',
    color: 'coral',
    icon: 'Users',
    allowedActions: ['SUBMIT_PROPOSAL', 'ACCEPT_PROPOSAL', 'CANCEL_BOUNTY'],
  },
  active_research: {
    label: 'Active Research',
    description: 'Lab conducting research with deadline',
    color: 'sage',
    icon: 'FlaskConical',
    allowedActions: ['SUBMIT_MILESTONE', 'REQUEST_EXTENSION', 'INITIATE_DISPUTE'],
  },
  extension_review: {
    label: 'Extension Review',
    description: 'Lab requested additional time',
    color: 'amber',
    icon: 'Clock',
    allowedActions: ['GRANT_EXTENSION', 'DENY_EXTENSION', 'INITIATE_DISPUTE'],
  },
  deadline_breach: {
    label: 'Deadline Exceeded',
    description: 'Research deadline has passed',
    color: 'destructive',
    icon: 'TimerOff',
    allowedActions: ['GRANT_EXTENSION', 'INITIATE_DISPUTE', 'SUBMIT_MILESTONE'],
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
