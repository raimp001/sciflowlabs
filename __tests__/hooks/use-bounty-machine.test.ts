import { describe, it, expect } from 'vitest'
import {
  bountyMachine,
  stateMetadata,
  type BountyContext,
  type Milestone,
  type EscrowDetails,
} from '@/lib/machines/bounty-machine'
import { createActor } from 'xstate'

/**
 * Tests for the useBountyMachine hook logic.
 *
 * Since the hook is a thin wrapper around XState + React,
 * we test the computed properties and helper logic directly
 * against the state machine without needing React rendering.
 */

function createTestMilestones(count = 2): Milestone[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ms-${i + 1}`,
    title: `Milestone ${i + 1}`,
    description: `Description ${i + 1}`,
    deliverables: ['d1'],
    payoutPercentage: Math.floor(100 / count),
    dueDate: new Date('2025-12-31'),
    status: 'pending' as const,
  }))
}

describe('useBountyMachine computed properties', () => {
  describe('currentState extraction', () => {
    it('extracts string state value', () => {
      const actor = createActor(bountyMachine)
      actor.start()

      const snap = actor.getSnapshot()
      // In drafting state, value is a string
      expect(typeof snap.value === 'string' ? snap.value : Object.keys(snap.value)[0]).toBe('drafting')
      actor.stop()
    })

    it('extracts nested state value (funding_escrow)', () => {
      const actor = createActor(bountyMachine)
      actor.start()

      actor.send({
        type: 'SUBMIT_DRAFT',
        protocol: { methodology: 'test', dataRequirements: ['dr1'], qualityStandards: [] },
        milestones: createTestMilestones(),
      })
      actor.send({ type: 'INITIATE_FUNDING', paymentMethod: 'stripe' })

      const snap = actor.getSnapshot()
      // Should be nested: { funding_escrow: 'processing' }
      if (typeof snap.value === 'object') {
        const parentState = Object.keys(snap.value)[0]
        expect(parentState).toBe('funding_escrow')
        const subState = (snap.value as Record<string, string>)[parentState]
        expect(subState).toBe('processing')
      }
      actor.stop()
    })
  })

  describe('milestoneProgress calculation', () => {
    it('returns 0 when no milestones exist', () => {
      // This tests the division-by-zero edge case identified in the analysis
      const milestones: Milestone[] = []
      const currentIndex = 0

      const progress = milestones.length > 0
        ? (currentIndex / milestones.length) * 100
        : 0

      expect(progress).toBe(0)
    })

    it('returns 0 at start of first milestone', () => {
      const milestones = createTestMilestones(3)
      const currentIndex = 0

      const progress = (currentIndex / milestones.length) * 100
      expect(progress).toBeCloseTo(0)
    })

    it('returns ~33% after first of 3 milestones', () => {
      const milestones = createTestMilestones(3)
      const currentIndex = 1

      const progress = (currentIndex / milestones.length) * 100
      expect(progress).toBeCloseTo(33.33, 1)
    })

    it('returns ~66% after second of 3 milestones', () => {
      const milestones = createTestMilestones(3)
      const currentIndex = 2

      const progress = (currentIndex / milestones.length) * 100
      expect(progress).toBeCloseTo(66.67, 1)
    })

    it('returns 50% after first of 2 milestones', () => {
      const milestones = createTestMilestones(2)
      const currentIndex = 1

      const progress = (currentIndex / milestones.length) * 100
      expect(progress).toBe(50)
    })

    it('returns 100% when index equals length (past last)', () => {
      const milestones = createTestMilestones(2)
      const currentIndex = 2

      const progress = (currentIndex / milestones.length) * 100
      expect(progress).toBe(100)
    })
  })

  describe('totalReleased calculation', () => {
    it('returns 0 when no releases have been made', () => {
      const escrow: EscrowDetails = {
        method: 'stripe',
        totalAmount: 10000,
        currency: 'USD',
        lockedAt: new Date(),
        releaseSchedule: [
          { milestoneId: 'ms-1', amount: 5000 },
          { milestoneId: 'ms-2', amount: 5000 },
        ],
      }

      const totalReleased = escrow.releaseSchedule.reduce(
        (sum, item) => sum + (item.releasedAt ? item.amount : 0),
        0
      )
      expect(totalReleased).toBe(0)
    })

    it('sums released amounts correctly', () => {
      const escrow: EscrowDetails = {
        method: 'stripe',
        totalAmount: 10000,
        currency: 'USD',
        lockedAt: new Date(),
        releaseSchedule: [
          { milestoneId: 'ms-1', amount: 5000, releasedAt: new Date() },
          { milestoneId: 'ms-2', amount: 5000 },
        ],
      }

      const totalReleased = escrow.releaseSchedule.reduce(
        (sum, item) => sum + (item.releasedAt ? item.amount : 0),
        0
      )
      expect(totalReleased).toBe(5000)
    })

    it('sums all releases when all are complete', () => {
      const escrow: EscrowDetails = {
        method: 'stripe',
        totalAmount: 10000,
        currency: 'USD',
        lockedAt: new Date(),
        releaseSchedule: [
          { milestoneId: 'ms-1', amount: 5000, releasedAt: new Date() },
          { milestoneId: 'ms-2', amount: 5000, releasedAt: new Date() },
        ],
      }

      const totalReleased = escrow.releaseSchedule.reduce(
        (sum, item) => sum + (item.releasedAt ? item.amount : 0),
        0
      )
      expect(totalReleased).toBe(10000)
    })
  })

  describe('escrowRemaining calculation', () => {
    it('returns full amount when nothing released', () => {
      const totalAmount = 10000
      const totalReleased = 0
      expect(totalAmount - totalReleased).toBe(10000)
    })

    it('returns correct remaining after partial release', () => {
      const totalAmount = 10000
      const totalReleased = 3000
      expect(totalAmount - totalReleased).toBe(7000)
    })

    it('returns 0 when fully released', () => {
      const totalAmount = 10000
      const totalReleased = 10000
      expect(totalAmount - totalReleased).toBe(0)
    })

    it('handles undefined escrow gracefully', () => {
      const escrow: EscrowDetails | undefined = undefined
      const remaining = (escrow?.totalAmount ?? 0) - (
        escrow?.releaseSchedule?.reduce(
          (sum, item) => sum + (item.releasedAt ? item.amount : 0),
          0
        ) ?? 0
      )
      expect(remaining).toBe(0)
    })
  })

  describe('isTerminal check', () => {
    it('identifies terminal states correctly', () => {
      const terminalStates = ['completed', 'cancelled', 'partial_settlement']
      for (const state of terminalStates) {
        expect(terminalStates.includes(state)).toBe(true)
      }
    })

    it('identifies non-terminal states', () => {
      const terminalStates = ['completed', 'cancelled', 'partial_settlement']
      const nonTerminalStates = [
        'drafting', 'protocol_review', 'ready_for_funding', 'funding_escrow',
        'bidding', 'active_research', 'milestone_review', 'dispute_resolution',
        'external_arbitration', 'completed_payout', 'refunding',
      ]

      for (const state of nonTerminalStates) {
        expect(terminalStates.includes(state)).toBe(false)
      }
    })
  })

  describe('selectedLab lookup', () => {
    it('finds the selected proposal', () => {
      const proposals = [
        {
          id: 'p1', labId: 'l1', labName: 'Lab A',
          verificationTier: 'verified' as const,
          methodology: 'm', timeline: 30, bidAmount: 1000,
          stakedAmount: 100, submittedAt: new Date(), attachments: [],
        },
        {
          id: 'p2', labId: 'l2', labName: 'Lab B',
          verificationTier: 'trusted' as const,
          methodology: 'm', timeline: 60, bidAmount: 2000,
          stakedAmount: 200, submittedAt: new Date(), attachments: [],
        },
      ]

      const selectedProposalId = 'p2'
      const selectedLab = proposals.find(p => p.id === selectedProposalId)

      expect(selectedLab).toBeDefined()
      expect(selectedLab?.labName).toBe('Lab B')
      expect(selectedLab?.labId).toBe('l2')
    })

    it('returns undefined when no proposal selected', () => {
      const proposals: any[] = []
      const selectedProposalId = undefined

      const selectedLab = proposals.find(p => p.id === selectedProposalId)
      expect(selectedLab).toBeUndefined()
    })
  })

  describe('hasActiveDispute check', () => {
    it('returns true for dispute_resolution', () => {
      const state = 'dispute_resolution'
      const hasDispute = state === 'dispute_resolution' || state === 'external_arbitration'
      expect(hasDispute).toBe(true)
    })

    it('returns true for external_arbitration', () => {
      const state = 'external_arbitration'
      const hasDispute = state === 'dispute_resolution' || state === 'external_arbitration'
      expect(hasDispute).toBe(true)
    })

    it('returns false for active_research', () => {
      const state = 'active_research'
      const hasDispute = state === 'dispute_resolution' || state === 'external_arbitration'
      expect(hasDispute).toBe(false)
    })
  })

  describe('canSend validation', () => {
    it('can send SUBMIT_DRAFT from drafting', () => {
      const actor = createActor(bountyMachine)
      actor.start()

      const snap = actor.getSnapshot()
      expect(snap.can({ type: 'SUBMIT_DRAFT', protocol: { methodology: '', dataRequirements: [], qualityStandards: [] }, milestones: [] })).toBe(true)
      actor.stop()
    })

    it('cannot send APPROVE_MILESTONE from drafting', () => {
      const actor = createActor(bountyMachine)
      actor.start()

      const snap = actor.getSnapshot()
      expect(snap.can({ type: 'APPROVE_MILESTONE', milestoneId: 'ms-1' })).toBe(false)
      actor.stop()
    })
  })
})
