"use client"

/**
 * React Hook for the Bounty Lifecycle State Machine
 * 
 * Provides a clean interface to interact with the XState bounty machine
 * in React components.
 */

import { useMachine } from "@xstate/react"
import { 
  bountyMachine, 
  stateMetadata,
  type BountyContext, 
  type BountyEvent,
  type BountyState,
  type PaymentMethod,
  type Milestone,
  type EscrowDetails,
  type DisputeReason
} from "@/lib/machines/bounty-machine"

export interface UseBountyMachineOptions {
  /** Initial bounty data to hydrate the machine */
  initialContext?: Partial<BountyContext>
  /** Callback when state changes */
  onStateChange?: (state: BountyState, context: BountyContext) => void
  /** Callback when bounty is completed */
  onComplete?: (context: BountyContext) => void
  /** Callback when entering dispute */
  onDispute?: (context: BountyContext) => void
}

export function useBountyMachine(options: UseBountyMachineOptions = {}) {
  const { initialContext, onStateChange, onComplete, onDispute } = options

  // Create the machine with initial context if provided
  const machine = bountyMachine.provide({
    // Can add custom actions/guards here if needed
  })

  const [state, send, actor] = useMachine(machine, {
    input: initialContext,
  })

  // Get current state as a string (handles nested states)
  const currentState = (() => {
    if (typeof state.value === 'string') {
      return state.value as BountyState
    }
    // Handle nested states like { funding_escrow: 'processing' }
    const keys = Object.keys(state.value)
    return keys[0] as BountyState
  })()

  // Get metadata for current state
  const currentStateMetadata = stateMetadata[currentState]

  // Get sub-state if in a nested state
  const subState = (() => {
    if (typeof state.value === 'object') {
      const keys = Object.keys(state.value)
      if (keys.length > 0) {
        const nested = state.value as Record<string, string>
        return nested[keys[0]]
      }
    }
    return null
  })()

  // Check if a specific event can be sent
  const canSend = (eventType: BountyEvent['type']) => {
    return state.can({ type: eventType } as BountyEvent)
  }

  // Helper actions
  const actions = {
    /** Submit draft with protocol and milestones */
    submitDraft: (protocol: BountyContext['protocol'], milestones: Milestone[]) => {
      if (canSend('SUBMIT_DRAFT')) {
        send({ type: 'SUBMIT_DRAFT', protocol, milestones })
      }
    },

    /** Initiate funding with selected payment method */
    initiateFunding: (paymentMethod: PaymentMethod) => {
      if (canSend('INITIATE_FUNDING')) {
        send({ type: 'INITIATE_FUNDING', paymentMethod })
      }
    },

    /** Confirm funding with escrow details */
    confirmFunding: (escrow: EscrowDetails) => {
      if (canSend('FUNDING_CONFIRMED')) {
        send({ type: 'FUNDING_CONFIRMED', escrow })
      }
    },

    /** Report funding failure */
    reportFundingFailed: (error: string) => {
      if (canSend('FUNDING_FAILED')) {
        send({ type: 'FUNDING_FAILED', error })
      }
    },

    /** Select a lab proposal */
    selectLab: (proposalId: string) => {
      if (canSend('SELECT_LAB')) {
        send({ type: 'SELECT_LAB', proposalId })
      }
    },

    /** Submit milestone evidence */
    submitMilestone: (milestoneId: string, evidenceHash: string, evidenceLinks: string[]) => {
      if (canSend('SUBMIT_MILESTONE')) {
        send({ type: 'SUBMIT_MILESTONE', milestoneId, evidenceHash, evidenceLinks })
      }
    },

    /** Approve a milestone */
    approveMilestone: (milestoneId: string) => {
      if (canSend('APPROVE_MILESTONE')) {
        send({ type: 'APPROVE_MILESTONE', milestoneId })
      }
    },

    /** Request revision on a milestone */
    requestRevision: (milestoneId: string, feedback: string) => {
      if (canSend('REQUEST_REVISION')) {
        send({ type: 'REQUEST_REVISION', milestoneId, feedback })
      }
    },

    /** Initiate a dispute */
    initiateDispute: (reason: DisputeReason, description: string, evidenceLinks: string[]) => {
      if (canSend('INITIATE_DISPUTE')) {
        send({ type: 'INITIATE_DISPUTE', reason, description, evidenceLinks })
      }
    },

    /** Cancel the bounty */
    cancelBounty: (reason: string) => {
      if (canSend('CANCEL_BOUNTY')) {
        send({ type: 'CANCEL_BOUNTY', reason })
      }
    },

    /** Release final payout */
    releaseFinalPayout: () => {
      if (canSend('RELEASE_FINAL_PAYOUT')) {
        send({ type: 'RELEASE_FINAL_PAYOUT' })
      }
    },
  }

  // Computed values
  const computed = {
    /** Is the bounty in a terminal state? */
    isTerminal: state.done || ['completed', 'cancelled', 'partial_settlement'].includes(currentState),

    /** Is funding locked in escrow? */
    isEscrowLocked: Boolean(state.context.escrow?.lockedAt),

    /** Current milestone being worked on */
    currentMilestone: state.context.milestones[state.context.currentMilestoneIndex],

    /** Progress as a percentage */
    milestoneProgress: state.context.milestones.length > 0
      ? (state.context.currentMilestoneIndex / state.context.milestones.length) * 100
      : 0,

    /** Is there an active dispute? */
    hasActiveDispute: currentState === 'dispute_resolution' || currentState === 'external_arbitration',

    /** Total amount released from escrow */
    totalReleased: state.context.escrow?.releaseSchedule?.reduce(
      (sum, item) => sum + (item.releasedAt ? item.amount : 0), 
      0
    ) ?? 0,

    /** Amount remaining in escrow */
    escrowRemaining: (state.context.escrow?.totalAmount ?? 0) - (
      state.context.escrow?.releaseSchedule?.reduce(
        (sum, item) => sum + (item.releasedAt ? item.amount : 0), 
        0
      ) ?? 0
    ),

    /** Selected lab/proposal info */
    selectedLab: state.context.proposals.find(p => p.id === state.context.selectedProposalId),
  }

  return {
    // State
    state: currentState,
    subState,
    context: state.context,
    metadata: currentStateMetadata,
    
    // Actions
    send,
    actions,
    canSend,
    
    // Computed
    ...computed,
    
    // Raw actor for advanced usage
    actor,
  }
}

// Re-export types for convenience
export type { 
  BountyContext, 
  BountyEvent, 
  BountyState, 
  PaymentMethod, 
  Milestone,
  EscrowDetails,
  DisputeReason
}
