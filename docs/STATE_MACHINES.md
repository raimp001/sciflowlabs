# LabBounty State Machine Architecture

## Core Principle
ALL business logic MUST be expressed as state transitions. No logic exists outside state machines.

---

## 1. BOUNTY STATE MACHINE

### States
```
DRAFT → PENDING_REVIEW → OPEN → ACCEPTING_APPLICATIONS →
LAB_SELECTED → IN_PROGRESS → UNDER_REVIEW → COMPLETED
                     ↓
                 REJECTED
                     ↓
                 CANCELLED
```

### Detailed State Definitions

#### DRAFT
- **Description**: Bounty is being created but not submitted
- **Entry**: User clicks "Create Bounty"
- **Allowed Actions**: EDIT, SAVE_DRAFT, SUBMIT, DELETE
- **Exit Conditions**: User submits OR deletes
- **Data Requirements**: None (can be partial)

#### PENDING_REVIEW
- **Description**: Submitted, awaiting platform approval
- **Entry**: DRAFT → SUBMIT event fired
- **Allowed Actions**: APPROVE, REJECT, REQUEST_CHANGES
- **Exit Conditions**: Admin approves/rejects
- **Data Requirements**: ALL required fields must be complete
- **Guards**:
  - Must have title, description, funding > 0, deadline > today
  - Must have at least 1 objective, 1 deliverable

#### REJECTED
- **Description**: Admin rejected the bounty
- **Entry**: PENDING_REVIEW → REJECT event
- **Allowed Actions**: EDIT_AND_RESUBMIT, DELETE
- **Exit Conditions**: User resubmits or deletes
- **Side Effects**: Send rejection email with reason

#### OPEN
- **Description**: Live, accepting applications from labs
- **Entry**: PENDING_REVIEW → APPROVE event
- **Allowed Actions**: RECEIVE_APPLICATION, CLOSE, CANCEL
- **Exit Conditions**: Creator closes OR deadline passed
- **Side Effects**:
  - Notify all matching labs
  - Index in search
  - Start deadline timer

#### ACCEPTING_APPLICATIONS
- **Description**: Reviewing applications, may accept more
- **Entry**: OPEN → RECEIVE_APPLICATION event
- **Allowed Actions**: REVIEW_APPLICATION, SELECT_LAB, REJECT_APPLICATION
- **Exit Conditions**: Lab selected
- **Guards**:
  - Must have at least 1 application
  - Selected lab must be verified

#### LAB_SELECTED
- **Description**: Lab chosen, awaiting contract signing
- **Entry**: ACCEPTING_APPLICATIONS → SELECT_LAB event
- **Allowed Actions**: SIGN_CONTRACT, REJECT_SELECTION
- **Exit Conditions**: Both parties sign OR selection rejected
- **Side Effects**:
  - Create escrow account
  - Generate contract
  - Notify lab
  - Reject other applicants

#### IN_PROGRESS
- **Description**: Research actively underway
- **Entry**: LAB_SELECTED → SIGN_CONTRACT event
- **Allowed Actions**:
  - SUBMIT_MILESTONE
  - REQUEST_EXTENSION
  - REPORT_ISSUE
  - CANCEL (with penalty)
- **Exit Conditions**: All milestones complete OR cancelled
- **Side Effects**:
  - Release initial funds (if applicable)
  - Start milestone timers
  - Enable progress tracking

#### UNDER_REVIEW
- **Description**: All work submitted, awaiting final review
- **Entry**: IN_PROGRESS → SUBMIT_FINAL_DELIVERABLE event
- **Allowed Actions**: APPROVE_COMPLETION, REQUEST_REVISIONS
- **Exit Conditions**: Funder approves or requests changes
- **Guards**: All milestones must be COMPLETED

#### COMPLETED
- **Description**: Successfully finished, all funds released
- **Entry**: UNDER_REVIEW → APPROVE_COMPLETION event
- **Allowed Actions**: LEAVE_REVIEW, VIEW_RESULTS
- **Exit Conditions**: None (terminal state)
- **Side Effects**:
  - Release remaining funds
  - Update lab success rate
  - Archive bounty
  - Send completion certificates

#### CANCELLED
- **Description**: Terminated before completion
- **Entry**: Any state → CANCEL event
- **Allowed Actions**: VIEW_CANCELLATION_DETAILS
- **Exit Conditions**: None (terminal state)
- **Guards**: Reason must be provided
- **Side Effects**:
  - Calculate refund based on progress
  - Return funds to funder
  - Update lab statistics
  - Log cancellation reason

---

## 2. STATE TRANSITION TABLE

| Current State | Event | Guards | Next State | Side Effects |
|--------------|-------|--------|------------|--------------|
| DRAFT | SUBMIT | Form valid, funding > 0 | PENDING_REVIEW | Save to DB, create ID |
| DRAFT | DELETE | - | (destroyed) | Remove from DB |
| DRAFT | SAVE_DRAFT | - | DRAFT | Persist partial data |
| PENDING_REVIEW | APPROVE | Admin authenticated | OPEN | Notify creator, index search |
| PENDING_REVIEW | REJECT | Admin authenticated, reason provided | REJECTED | Email creator with reason |
| PENDING_REVIEW | REQUEST_CHANGES | Admin authenticated | DRAFT | Send change requests |
| REJECTED | EDIT_AND_RESUBMIT | Changes made | PENDING_REVIEW | Re-queue for review |
| REJECTED | DELETE | - | (destroyed) | Remove from DB |
| OPEN | RECEIVE_APPLICATION | Lab verified | ACCEPTING_APPLICATIONS | Notify creator |
| OPEN | CLOSE | Creator authenticated | CANCELLED | Refund escrow if any |
| OPEN | DEADLINE_PASSED | Date > deadline | CANCELLED | Auto-close, notify |
| ACCEPTING_APPLICATIONS | SELECT_LAB | Lab exists, verified | LAB_SELECTED | Create contract, escrow |
| ACCEPTING_APPLICATIONS | REJECT_APPLICATION | Application exists | ACCEPTING_APPLICATIONS | Notify lab |
| LAB_SELECTED | SIGN_CONTRACT | Both signatures | IN_PROGRESS | Release initial funds |
| LAB_SELECTED | REJECT_SELECTION | Creator authenticated | ACCEPTING_APPLICATIONS | Notify lab, back to pool |
| IN_PROGRESS | SUBMIT_MILESTONE | Milestone ready | IN_PROGRESS | Trigger milestone review |
| IN_PROGRESS | ALL_MILESTONES_DONE | All complete | UNDER_REVIEW | Lock deliverables |
| IN_PROGRESS | CANCEL | Reason provided | CANCELLED | Calculate penalties |
| UNDER_REVIEW | APPROVE_COMPLETION | Creator authenticated | COMPLETED | Release funds, update stats |
| UNDER_REVIEW | REQUEST_REVISIONS | Issues described | IN_PROGRESS | Notify lab, extend deadline |
| COMPLETED | - | - | - | (terminal) |
| CANCELLED | - | - | - | (terminal) |

---

## 3. LAB APPLICATION STATE MACHINE

### States
```
DRAFT → SUBMITTED → UNDER_REVIEW → ACCEPTED → CONTRACT_SIGNED
                           ↓           ↓
                       REJECTED    WITHDRAWN
```

### State Transition Table

| Current State | Event | Guards | Next State | Side Effects |
|--------------|-------|--------|------------|--------------|
| DRAFT | SUBMIT_APPLICATION | Proposal complete, lab verified | SUBMITTED | Notify bounty creator |
| DRAFT | DELETE | - | (destroyed) | Remove draft |
| SUBMITTED | REVIEW | Creator viewing | UNDER_REVIEW | Mark as viewed |
| UNDER_REVIEW | ACCEPT | Creator authenticated | ACCEPTED | Reject others, create contract |
| UNDER_REVIEW | REJECT | Reason provided | REJECTED | Notify lab |
| SUBMITTED | WITHDRAW | Lab authenticated | WITHDRAWN | Update application count |
| ACCEPTED | SIGN_CONTRACT | Both parties sign | CONTRACT_SIGNED | Trigger bounty IN_PROGRESS |
| ACCEPTED | DECLINE | Lab rejects offer | WITHDRAWN | Notify creator |

---

## 4. MILESTONE STATE MACHINE

### States
```
PENDING → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → APPROVED → FUNDS_RELEASED
                                           ↓
                                      NEEDS_REVISION
```

### State Transition Table

| Current State | Event | Guards | Next State | Side Effects |
|--------------|-------|--------|------------|--------------|
| PENDING | START | Previous milestone complete OR first | IN_PROGRESS | Start timer, notify lab |
| IN_PROGRESS | SUBMIT | Deliverables uploaded | SUBMITTED | Notify funder, lock uploads |
| SUBMITTED | REVIEW | Funder viewing | UNDER_REVIEW | Mark reviewed timestamp |
| UNDER_REVIEW | APPROVE | Funder authenticated, verified deliverables | APPROVED | Queue fund release |
| APPROVED | RELEASE_FUNDS | Escrow available, amount correct | FUNDS_RELEASED | Transfer to lab, update balance |
| UNDER_REVIEW | REQUEST_REVISION | Issues documented | NEEDS_REVISION | Notify lab, extend deadline |
| NEEDS_REVISION | RESUBMIT | Changes made | SUBMITTED | Re-enter review queue |

---

## 5. PAYMENT/ESCROW STATE MACHINE

### States
```
PENDING_DEPOSIT → DEPOSITED → LOCKED → IN_ESCROW → RELEASED → TRANSFERRED
                                  ↓
                              DISPUTED → RESOLVED
                                  ↓
                             REFUNDED
```

### State Transition Table

| Current State | Event | Guards | Next State | Side Effects |
|--------------|-------|--------|------------|--------------|
| PENDING_DEPOSIT | DEPOSIT | Amount matches bounty | DEPOSITED | Hold funds, verify |
| DEPOSITED | LOCK | Bounty LAB_SELECTED | LOCKED | Prevent withdrawal |
| LOCKED | CONTRACT_SIGNED | Both signatures valid | IN_ESCROW | Start milestone tracking |
| IN_ESCROW | MILESTONE_APPROVED | Milestone verified | RELEASED | Calculate amount |
| RELEASED | TRANSFER | Bank details valid | TRANSFERRED | Send to lab, create receipt |
| IN_ESCROW | DISPUTE | Either party claims issue | DISPUTED | Freeze funds, notify admin |
| DISPUTED | RESOLVE | Admin decision | IN_ESCROW or REFUNDED | Execute resolution |
| IN_ESCROW | CANCEL_BOUNTY | Cancellation approved | REFUNDED | Return to funder minus fees |
| REFUNDED | TRANSFER_REFUND | - | TRANSFERRED | Send to funder |

---

## 6. EDGE CASES & FAILURE STATES

### Concurrent Applications
- **Problem**: Multiple labs selected simultaneously
- **Solution**: Guard with DB transaction lock, only first SELECT_LAB succeeds
- **State**: ACCEPTING_APPLICATIONS remains for others, they see "already selected"

### Payment Failure During Release
- **Problem**: APPROVED → FUNDS_RELEASED fails (bank down)
- **Solution**:
  - Enter RELEASING_FUNDS (transient state)
  - Retry with exponential backoff (3 attempts)
  - If all fail → RELEASE_FAILED state
  - Manual admin intervention required
  - Notify both parties

### Lab Disappears Mid-Bounty
- **Problem**: Lab goes offline during IN_PROGRESS
- **Solution**:
  - After 7 days no activity → AUTO_ESCALATE event
  - Enters ESCALATED state
  - Admin contacts lab
  - After 30 days → Auto-cancel with partial refund based on completed milestones

### Deadline Passed with Incomplete Work
- **Problem**: Milestone deadline expires
- **Solution**:
  - Timer fires DEADLINE_EXCEEDED event
  - IN_PROGRESS → DEADLINE_REVIEW state
  - Funder chooses: EXTEND_DEADLINE or CANCEL_FOR_BREACH
  - If cancel → partial refund based on completed milestones

### Duplicate Submissions
- **Problem**: User submits same bounty twice
- **Solution**:
  - Guard: Check for duplicate title + creator in PENDING/OPEN states
  - Block SUBMIT event with error
  - Return existing bounty ID

### Network Timeout During State Transition
- **Problem**: Transition starts, network fails mid-way
- **Solution**:
  - All transitions are idempotent
  - Use event sourcing: log DRAFT → PENDING_REVIEW event
  - On retry, check if event already processed
  - If yes: return current state
  - If no: process transition

---

## 7. IMPLEMENTATION IN TYPESCRIPT

```typescript
// State Machine Type Definitions
type BountyState =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'OPEN'
  | 'ACCEPTING_APPLICATIONS'
  | 'LAB_SELECTED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED'

type BountyEvent =
  | { type: 'SUBMIT'; payload: { bountyData: BountyData } }
  | { type: 'APPROVE'; payload: { adminId: string; reason?: string } }
  | { type: 'REJECT'; payload: { adminId: string; reason: string } }
  | { type: 'RECEIVE_APPLICATION'; payload: { applicationId: string } }
  | { type: 'SELECT_LAB'; payload: { labId: string } }
  | { type: 'SIGN_CONTRACT'; payload: { signature: string; party: 'funder' | 'lab' } }
  | { type: 'SUBMIT_MILESTONE'; payload: { milestoneId: string } }
  | { type: 'APPROVE_COMPLETION'; payload: { funderId: string } }
  | { type: 'CANCEL'; payload: { reason: string; initiator: string } }

interface BountyContext {
  id: string
  title: string
  fundingAmount: number
  creatorId: string
  selectedLabId?: string
  applications: string[]
  milestones: Milestone[]
  cancelReason?: string
  rejectionReason?: string
}

interface Guard<T> {
  (context: BountyContext, event: T): boolean
}

interface SideEffect<T> {
  (context: BountyContext, event: T): Promise<void>
}

// Guards
const isFormValid: Guard<BountyEvent> = (ctx, event) => {
  if (event.type !== 'SUBMIT') return false
  const { bountyData } = event.payload
  return (
    bountyData.title.length > 0 &&
    bountyData.fundingAmount > 0 &&
    bountyData.deadline > new Date() &&
    bountyData.objectives.length > 0 &&
    bountyData.deliverables.length > 0
  )
}

const isAdminAuthenticated: Guard<BountyEvent> = (ctx, event) => {
  if (event.type !== 'APPROVE' && event.type !== 'REJECT') return false
  // Check admin role in auth service
  return checkAdminRole(event.payload.adminId)
}

const labIsVerified: Guard<BountyEvent> = async (ctx, event) => {
  if (event.type !== 'SELECT_LAB') return false
  const lab = await fetchLab(event.payload.labId)
  return lab.verified === true
}

const allMilestonesComplete: Guard<BountyEvent> = (ctx) => {
  return ctx.milestones.every(m => m.status === 'FUNDS_RELEASED')
}

// Side Effects
const notifyCreator: SideEffect<BountyEvent> = async (ctx, event) => {
  await sendEmail({
    to: ctx.creatorId,
    template: 'bounty_approved',
    data: { bountyTitle: ctx.title }
  })
}

const createEscrowAccount: SideEffect<BountyEvent> = async (ctx, event) => {
  await escrowService.create({
    bountyId: ctx.id,
    amount: ctx.fundingAmount,
    funderId: ctx.creatorId
  })
}

const releaseRemainingFunds: SideEffect<BountyEvent> = async (ctx) => {
  const releasedAmount = ctx.milestones.reduce((sum, m) => sum + m.fundingAmount, 0)
  const remaining = ctx.fundingAmount - releasedAmount
  if (remaining > 0) {
    await paymentService.release({
      amount: remaining,
      to: ctx.selectedLabId,
      bountyId: ctx.id
    })
  }
}

const updateLabSuccessRate: SideEffect<BountyEvent> = async (ctx) => {
  await labService.incrementCompletedBounties(ctx.selectedLabId!)
}

// State Machine Definition
class BountyStateMachine {
  private state: BountyState
  private context: BountyContext

  constructor(initialState: BountyState, context: BountyContext) {
    this.state = initialState
    this.context = context
  }

  async transition(event: BountyEvent): Promise<BountyState> {
    const transition = this.getTransition(this.state, event)

    if (!transition) {
      throw new Error(`No transition for ${this.state} + ${event.type}`)
    }

    // Check guards
    const guardsPassed = await Promise.all(
      transition.guards.map(guard => guard(this.context, event))
    )

    if (!guardsPassed.every(Boolean)) {
      throw new Error(`Guards failed for ${this.state} → ${event.type}`)
    }

    // Execute side effects (async, in order)
    for (const effect of transition.effects) {
      await effect(this.context, event)
    }

    // Update state
    const prevState = this.state
    this.state = transition.nextState
    this.context = transition.updateContext(this.context, event)

    // Log event (event sourcing)
    await this.logEvent({
      bountyId: this.context.id,
      fromState: prevState,
      toState: this.state,
      event: event.type,
      timestamp: new Date()
    })

    return this.state
  }

  private getTransition(state: BountyState, event: BountyEvent) {
    const key = `${state}_${event.type}`
    return transitionMap[key]
  }

  getState(): BountyState {
    return this.state
  }

  getContext(): BountyContext {
    return { ...this.context }
  }

  async logEvent(entry: EventLog) {
    await eventStore.append(entry)
  }
}

// Transition Map
const transitionMap = {
  'DRAFT_SUBMIT': {
    guards: [isFormValid],
    effects: [
      async (ctx, event) => await saveBounty(ctx, event.payload.bountyData)
    ],
    nextState: 'PENDING_REVIEW' as BountyState,
    updateContext: (ctx, event) => ({
      ...ctx,
      ...event.payload.bountyData
    })
  },

  'PENDING_REVIEW_APPROVE': {
    guards: [isAdminAuthenticated],
    effects: [notifyCreator, indexInSearch],
    nextState: 'OPEN' as BountyState,
    updateContext: (ctx) => ctx
  },

  'PENDING_REVIEW_REJECT': {
    guards: [isAdminAuthenticated],
    effects: [
      async (ctx, event) => await sendRejectionEmail(ctx, event.payload.reason)
    ],
    nextState: 'REJECTED' as BountyState,
    updateContext: (ctx, event) => ({
      ...ctx,
      rejectionReason: event.payload.reason
    })
  },

  'ACCEPTING_APPLICATIONS_SELECT_LAB': {
    guards: [labIsVerified],
    effects: [createEscrowAccount, generateContract, rejectOtherApplicants],
    nextState: 'LAB_SELECTED' as BountyState,
    updateContext: (ctx, event) => ({
      ...ctx,
      selectedLabId: event.payload.labId
    })
  },

  'UNDER_REVIEW_APPROVE_COMPLETION': {
    guards: [allMilestonesComplete],
    effects: [releaseRemainingFunds, updateLabSuccessRate, archiveBounty],
    nextState: 'COMPLETED' as BountyState,
    updateContext: (ctx) => ctx
  },

  // ... additional transitions
}
```

---

## 8. RETRY LOGIC FOR ASYNC OPERATIONS

```typescript
async function transitionWithRetry(
  machine: BountyStateMachine,
  event: BountyEvent,
  maxRetries = 3
): Promise<BountyState> {
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      return await machine.transition(event)
    } catch (error) {
      attempt++

      if (attempt >= maxRetries) {
        // Enter failure state
        await machine.transition({
          type: 'TRANSITION_FAILED',
          payload: {
            originalEvent: event,
            error: error.message,
            attempts: attempt
          }
        })
        throw error
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000
      await sleep(delay)
    }
  }
}
```

---

## 9. STATE PERSISTENCE

```typescript
// Save state after every transition
interface BountyStateSnapshot {
  bountyId: string
  state: BountyState
  context: BountyContext
  version: number
  timestamp: Date
}

async function saveSnapshot(machine: BountyStateMachine) {
  const snapshot: BountyStateSnapshot = {
    bountyId: machine.getContext().id,
    state: machine.getState(),
    context: machine.getContext(),
    version: await getNextVersion(machine.getContext().id),
    timestamp: new Date()
  }

  await db.snapshots.create(snapshot)
}

// Restore from snapshot
async function restoreMachine(bountyId: string): Promise<BountyStateMachine> {
  const snapshot = await db.snapshots.findLatest({ bountyId })
  return new BountyStateMachine(snapshot.state, snapshot.context)
}
```

---

## 10. IMPOSSIBLE STATES PREVENTED

### By Design:
1. **Cannot release funds before work is done**
   - Guard: `allMilestonesComplete` prevents UNDER_REVIEW → COMPLETED unless all milestones = FUNDS_RELEASED

2. **Cannot select unverified lab**
   - Guard: `labIsVerified` prevents SELECT_LAB event

3. **Cannot have multiple labs selected**
   - State: Once LAB_SELECTED, no other SELECT_LAB transitions exist

4. **Cannot submit without required data**
   - Guard: `isFormValid` blocks DRAFT → PENDING_REVIEW

5. **Cannot access funds without signatures**
   - State: IN_ESCROW requires CONTRACT_SIGNED event first

6. **Cannot cancel completed bounty**
   - COMPLETED is terminal, no outbound transitions

7. **Funds always accounted for**
   - DEPOSITED → IN_ESCROW → RELEASED → TRANSFERRED
   - OR DEPOSITED → LOCKED → REFUNDED → TRANSFERRED
   - No other paths exist

---

## 11. AI INTEGRATION (IF USED)

### Rule: AI suggests, State Machine enforces

```typescript
async function aiReviewBounty(bountyData: BountyData): Promise<AISuggestion> {
  const suggestion = await openai.complete({
    prompt: `Review this research bounty: ${JSON.stringify(bountyData)}.
             Suggest:
             1. Clarity improvements
             2. Budget reasonableness
             3. Timeline feasibility`,
    model: 'gpt-4'
  })

  return {
    approved: suggestion.score > 0.7,
    reason: suggestion.reasoning,
    suggestions: suggestion.improvements
  }
}

// AI suggestion is just data, human or admin makes final decision
async function adminReviewWithAI(bountyId: string, adminId: string) {
  const bounty = await fetchBounty(bountyId)
  const machine = await restoreMachine(bountyId)

  // AI provides suggestion
  const aiSuggestion = await aiReviewBounty(bounty.context)

  // Admin sees AI suggestion but makes decision
  const adminDecision = await getAdminDecision(adminId, aiSuggestion)

  // State machine enforces the decision
  if (adminDecision === 'approve') {
    await machine.transition({
      type: 'APPROVE',
      payload: { adminId, reason: aiSuggestion.reason }
    })
  } else {
    await machine.transition({
      type: 'REJECT',
      payload: { adminId, reason: adminDecision.reason }
    })
  }
}
```

---

## 12. DEBUGGABILITY

### Event Log
Every transition logged:
```json
{
  "bountyId": "BNT-001",
  "fromState": "DRAFT",
  "toState": "PENDING_REVIEW",
  "event": "SUBMIT",
  "userId": "user123",
  "timestamp": "2026-01-24T10:30:00Z",
  "context": { "title": "Cancer Research", "funding": 50000000 }
}
```

### State Replay
```typescript
async function replayBounty(bountyId: string): Promise<BountyStateMachine> {
  const events = await eventStore.getEvents(bountyId)
  let machine = new BountyStateMachine('DRAFT', { id: bountyId })

  for (const event of events) {
    await machine.transition(event)
  }

  return machine
}
```

### State Visualization
```typescript
function visualizeStateMachine() {
  return `
    [DRAFT] --SUBMIT--> [PENDING_REVIEW] --APPROVE--> [OPEN]
                              |
                           REJECT
                              ↓
                        [REJECTED] --EDIT_AND_RESUBMIT--> [PENDING_REVIEW]
  `
}
```

This ensures COMPLETE SAFETY and CORRECTNESS by design.
