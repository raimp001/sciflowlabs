# Test Coverage Analysis

## Executive Summary

This codebase currently has **zero test coverage**. There are no test files, no test framework configured, and no test-related dependencies installed. For a platform handling financial transactions (Stripe, Solana, Base/USDC), bounty lifecycle management, and user authentication, this represents significant risk.

This document analyzes the codebase and proposes a prioritized testing strategy.

---

## Current State

| Metric | Value |
|--------|-------|
| Test files | 0 |
| Test framework | None |
| Test dependencies | None |
| Source files (TS/TSX) | ~103 |
| Lines of business logic (lib/) | ~3,535 |
| API routes | 21 |
| Custom hooks | 8 files, 15 hooks |
| React components | 27 |

---

## Recommended Test Framework Setup

Install Vitest (fast, Vite-native, ESM-first) with React Testing Library:

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom msw
```

Vitest is recommended over Jest for this project because:
- Native ESM support (Next.js App Router uses ESM)
- Faster execution with Vite's transform pipeline
- Compatible with the existing TypeScript and React 19 setup
- Built-in mocking utilities

---

## Priority 1: Critical (Financial & Security)

These areas handle money and authentication. Bugs here cause direct financial loss or security breaches.

### 1.1 Bounty State Machine (`lib/machines/bounty-machine.ts`)

**Risk: HIGH** | **Testability: HIGH** | **Effort: MEDIUM**

The state machine governs the entire bounty lifecycle across 13 states with 16 guard functions and 12 action functions. It is the core business logic engine.

**What to test:**
- Every valid state transition (drafting → protocol_review → ready_for_funding → ...)
- Guard functions reject invalid transitions (e.g., cannot move to `active_research` without a selected lab)
- Side-effect actions set correct context values (e.g., `completeBounty` sets completion date)
- Invalid event sends from wrong states are rejected
- Edge cases: zero milestones, missing proposal data, empty context fields

**Why it matters:**
- Controls when funds are released or refunded
- Determines if stakes get slashed
- A missed guard could allow unauthorized state transitions

**Example test cases:**
```
- Bounty in 'drafting' state can transition to 'protocol_review' via SUBMIT_FOR_REVIEW
- Bounty in 'drafting' state CANNOT transition to 'active_research'
- APPROVE_PROTOCOL requires admin role in context
- SELECT_LAB action sets selectedLab and selectedProposal in context
- All 13 terminal/intermediate states are reachable through valid paths
```

### 1.2 Payment Handlers (`lib/payments/`)

**Risk: CRITICAL** | **Testability: MEDIUM** | **Effort: HIGH**

Three payment processors (Stripe, Solana, Base) each implementing initiate → confirm → release/refund flows. Combined ~1,800 lines of financial logic.

**What to test:**

**Stripe Processor (`hybrid-payment-handler.ts` + `app/api/payments/stripe/`):**
- Payment intent creation with correct amount and manual capture mode
- Platform fee calculation (verify 3% fee deduction)
- Capture flow: partial capture for milestone payments
- Webhook signature verification
- Duplicate payment prevention
- Refund flow
- Error handling when Stripe API fails

**Solana Processor (`lib/payments/solana.ts`):**
- PDA escrow address derivation is deterministic
- Deposit verification validates correct USDC amount (within 1% tolerance)
- Transfer amount extraction from parsed transactions
- Balance checks prevent over-allocation
- Keypair loading from both JSON array and base58 formats

**Base/CDP Processor (`lib/payments/base-cdp.ts`):**
- CREATE2 escrow address computation
- Transfer event parsing from transaction receipts
- USDC amount validation with 6-decimal precision
- Network selection (mainnet vs. sepolia) based on environment

**Why it matters:**
- Incorrect fee calculations directly impact revenue
- Failed escrow verification could release funds prematurely
- Tolerance thresholds (1%) could be exploited with dust amounts

### 1.3 Bounty Transition API (`app/api/bounties/[id]/transition/route.ts`)

**Risk: CRITICAL** | **Testability: MEDIUM** | **Effort: HIGH**

This is the most complex API route (~400+ lines). It orchestrates state transitions with permission checking, stake locking/slashing, milestone management, and notifications.

**What to test:**
- Permission matrix: funder can only send funder events, lab can only send lab events
- Stake locking on research start (correct amount locked)
- Stake slashing on dispute resolution (correct percentage)
- Milestone completion updates milestone status and triggers payment
- Each transition creates correct notification for the relevant party
- State history is recorded for every transition (audit trail)
- Invalid transitions return 400 with descriptive error

### 1.4 Wallet Authentication (`app/api/auth/wallet/route.ts`)

**Risk: CRITICAL** | **Testability: HIGH** | **Effort: LOW**

**What to test:**
- Missing fields (provider, address, signature) return 400
- Invalid provider type is rejected
- User creation flow for new wallet addresses
- User lookup flow for existing wallet addresses
- **CRITICAL: Signature verification is currently commented out as incomplete** — tests should be written to enforce this is implemented before deployment

### 1.5 Dispute Resolution (`app/api/disputes/[id]/resolve/route.ts`)

**Risk: CRITICAL** | **Testability: MEDIUM** | **Effort: MEDIUM**

**What to test:**
- Only admin/arbitrator roles can resolve disputes
- Stake slashing calculates correct amounts
- Resolution types (refund_funder, pay_lab, split) produce correct financial outcomes
- Resolved disputes cannot be resolved again
- Bounty state transitions correctly after resolution

---

## Priority 2: High (Core Business Logic)

### 2.1 Rate Limiter (`lib/rate-limit.ts`)

**Risk: MEDIUM** | **Testability: HIGH** | **Effort: LOW**

Pure in-memory rate limiter with no external dependencies — ideal candidate for unit testing.

**What to test:**
- Requests within limit are allowed
- Requests exceeding limit are blocked
- Window expiration resets the counter
- Correct rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- Each preset profile (auth: 10/min, payment: 20/min, strict: 5/min) enforces its limits
- Cleanup removes expired entries

### 2.2 Bounty CRUD API (`app/api/bounties/route.ts`, `app/api/bounties/[id]/route.ts`)

**Risk: HIGH** | **Testability: MEDIUM** | **Effort: MEDIUM**

**What to test:**
- Bounty creation validates milestone percentages sum to 100%
- Bounty creation with invalid milestones (e.g., sum = 99%) returns 400
- Only bounty owner can update/delete
- Deletion only allowed in draft state
- Search filtering works (text search, tags, budget range)
- Pagination returns correct page/total counts

### 2.3 Proposal API (`app/api/proposals/`)

**Risk: HIGH** | **Testability: MEDIUM** | **Effort: MEDIUM**

**What to test:**
- Lab tier validation: unverified lab cannot submit to bounty requiring "verified" tier
- Duplicate proposal prevention (same lab, same bounty)
- Accepting one proposal rejects all others for that bounty
- Proposal acceptance triggers bounty state transition to `active_research`
- Only the bounty funder can accept/reject proposals

### 2.4 IPFS Client (`lib/ipfs/client.ts`)

**Risk: MEDIUM** | **Testability: MEDIUM** | **Effort: LOW**

**What to test:**
- SHA-256 hash calculation produces deterministic results
- Evidence verification: correct hash passes, incorrect hash fails
- Evidence bundle manifest structure is valid
- Multi-gateway fallback: primary fails → secondary gateway attempted
- Upload metadata is correctly formatted for Pinata API

### 2.5 Lab Verification API (`app/api/labs/[id]/verification/route.ts`)

**Risk: HIGH** | **Testability: MEDIUM** | **Effort: LOW**

**What to test:**
- Verification tier ordering is enforced (basic < verified < trusted < institutional)
- Duplicate verification requests are prevented
- Only admins can approve/reject verifications
- Lab owners can only view their own verification status

---

## Priority 3: Medium (Hooks & UI Logic)

### 3.1 `useBountyMachine` Hook (`hooks/use-bounty-machine.ts`)

**Risk: MEDIUM** | **Testability: GOOD** | **Effort: MEDIUM**

**What to test:**
- Nested state value extraction handles both string and object state values
- Milestone progress calculation: `(currentIndex / totalMilestones) * 100`
- **Edge case: zero milestones should not cause division by zero**
- Escrow remaining calculation: `totalFunded - totalReleased`
- `canSend` correctly reports available transitions for current state
- Actions object validates `canSend` before dispatching events

### 3.2 `useNotifications` Hook (`hooks/use-notifications.ts`)

**Risk: MEDIUM** | **Testability: CHALLENGING** | **Effort: MEDIUM**

**What to test:**
- Optimistic state updates: marking as read updates UI immediately
- `markAllAsRead` updates all notifications in state
- Unread count calculation is correct
- Real-time subscription adds new notifications to state
- Browser notification permission flow

### 3.3 Auth Context (`contexts/auth-context.tsx`)

**Risk: HIGH** | **Testability: CHALLENGING** | **Effort: HIGH**

**What to test:**
- Privy authentication syncs user to Supabase correctly
- Wallet address prioritization: embedded wallets[0] > privyUser.wallet > dbUser.evm
- Role derivation: isFunder, isLab, isAdmin flags match database role
- Lab data is fetched when user role is 'lab'
- Sign out clears both Privy and Supabase sessions
- **Race condition: concurrent Privy and Supabase auth changes should not corrupt state**

### 3.4 `useProposalActions` Hook (`hooks/use-proposals.ts`)

**Risk: LOW** | **Testability: GOOD** | **Effort: LOW**

**What to test:**
- Accept and reject call correct API endpoints
- **Bug: shared `isLoading` state between accept and reject operations** — accepting while rejecting could show incorrect loading state

### 3.5 EAS Attestation Encoding (`lib/attestations/eas.ts`)

**Risk: LOW** | **Testability: HIGH** | **Effort: LOW**

**What to test:**
- `encodeLabCredential` produces valid ABI-encoded data
- `encodeResearchRecord` produces valid ABI-encoded data
- Schema UIDs match expected format
- EAS scan URL generation is correct

---

## Priority 4: Low (Configuration & UI Components)

### 4.1 Environment Validation (`lib/env.ts`)

- Required vars missing should throw or warn
- Payment method availability flags are correct

### 4.2 Utility Functions (`lib/utils.ts`)

- `cn()` merges Tailwind classes correctly, resolving conflicts

### 4.3 UI Components (`components/ui/`)

- shadcn/ui components are third-party and well-tested upstream
- Custom components (`create-bounty-modal.tsx`, `payment-modal.tsx`, `state-machine-visualizer.tsx`) could benefit from snapshot/interaction tests but are lower priority

---

## Identified Bugs & Issues to Cover with Tests

| # | Location | Issue | Severity |
|---|----------|-------|----------|
| 1 | `app/api/auth/wallet/route.ts` | Signature verification not implemented | CRITICAL |
| 2 | `hooks/use-proposals.ts` | `useProposalActions` shares `isLoading` between accept/reject | LOW |
| 3 | `hooks/use-bounty-machine.ts` | Potential division by zero in milestone progress with 0 milestones | MEDIUM |
| 4 | `contexts/auth-context.tsx` | Race condition between Privy and Supabase auth sync | HIGH |
| 5 | `lib/payments/hybrid-payment-handler.ts` | Solana IDL is a mock (`{instructions: [], accounts: []}`) | HIGH |
| 6 | `lib/rate-limit.ts` | In-memory rate limiter resets on server restart | MEDIUM |
| 7 | `app/api/farcaster-manifest/route.ts` | Placeholder custody wallet signature | LOW |
| 8 | `hooks/use-notifications.ts` | Silent failures on DB operations (no error handling) | MEDIUM |

---

## Suggested Test File Structure

```
__tests__/
├── lib/
│   ├── machines/
│   │   └── bounty-machine.test.ts        # State machine transitions & guards
│   ├── payments/
│   │   ├── hybrid-payment-handler.test.ts # Payment processor strategy tests
│   │   ├── solana.test.ts                 # Solana escrow operations
│   │   └── base-cdp.test.ts              # Base chain operations
│   ├── rate-limit.test.ts                 # Rate limiter unit tests
│   ├── ipfs/
│   │   └── client.test.ts                # IPFS upload/hash/verify
│   ├── attestations/
│   │   └── eas.test.ts                   # Encoding functions
│   └── env.test.ts                       # Environment validation
├── api/
│   ├── bounties/
│   │   ├── route.test.ts                 # CRUD operations
│   │   └── transition.test.ts            # State transitions
│   ├── payments/
│   │   ├── stripe.test.ts                # Stripe payment flow
│   │   ├── stripe-capture.test.ts        # Payment capture
│   │   ├── stripe-webhook.test.ts        # Webhook handling
│   │   └── crypto.test.ts               # Crypto escrow
│   ├── proposals/
│   │   └── route.test.ts                # Proposal CRUD & actions
│   ├── disputes/
│   │   └── resolve.test.ts              # Dispute resolution
│   ├── auth/
│   │   └── wallet.test.ts               # Wallet auth
│   └── staking/
│       └── route.test.ts                # Staking operations
├── hooks/
│   ├── use-bounty-machine.test.ts        # Machine wrapper hook
│   ├── use-proposals.test.ts             # Proposal hooks
│   ├── use-notifications.test.ts         # Notification hooks
│   └── use-bounties.test.ts             # Bounty hooks
└── contexts/
    └── auth-context.test.tsx             # Auth provider tests
```

---

## Recommended Implementation Order

1. **Set up Vitest + testing dependencies** — foundation for everything else
2. **Bounty state machine tests** — highest value per effort, pure logic, no mocking needed
3. **Rate limiter tests** — quick win, pure functions, builds testing momentum
4. **EAS encoding tests** — quick win, pure functions
5. **Payment handler unit tests** — critical financial logic (with mocked Stripe/blockchain)
6. **API route integration tests** — bounty transition, dispute resolution, auth
7. **Hook tests** — useBountyMachine, useProposals
8. **Auth context tests** — complex but important for security
9. **IPFS client tests** — medium priority
10. **Component tests** — lowest priority, add as needed

---

## Coverage Targets

| Category | Target | Rationale |
|----------|--------|-----------|
| `lib/machines/` | 95%+ | Core business rules, pure logic |
| `lib/payments/` | 90%+ | Financial operations |
| `lib/rate-limit.ts` | 95%+ | Security mechanism |
| API routes (financial) | 85%+ | Payment, staking, disputes |
| API routes (CRUD) | 75%+ | Standard operations |
| Hooks (complex) | 70%+ | Business logic in hooks |
| Hooks (simple) | 50%+ | Thin wrappers |
| Components | 30%+ | UI rendering |
