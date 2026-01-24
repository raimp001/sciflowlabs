# Multi-Chain Payment State Machines

## Payment Architecture Overview

LabBounty supports 4 payment rails:
1. **Base (L2 Ethereum)** - USDC, ETH
2. **Solana** - USDC, SOL
3. **Stripe** - Credit/Debit cards
4. **Traditional** - ACH/Wire transfers

Each has its own state machine, all converging to a unified ESCROW state.

---

## UNIFIED PAYMENT STATE MACHINE

### High-Level States
```
PAYMENT_METHOD_SELECTION →
├─ BASE_DEPOSIT → BASE_CONFIRMING → UNIFIED_ESCROW
├─ SOLANA_DEPOSIT → SOLANA_CONFIRMING → UNIFIED_ESCROW
├─ STRIPE_DEPOSIT → STRIPE_PROCESSING → UNIFIED_ESCROW
└─ WIRE_DEPOSIT → WIRE_PENDING → UNIFIED_ESCROW

UNIFIED_ESCROW → LOCKED → MILESTONE_RELEASE → PAYOUT
                     ↓
                  DISPUTED → RESOLVED
                     ↓
                  REFUNDED
```

---

## 1. BASE (L2 ETHEREUM) STATE MACHINE

### States
```
WALLET_CONNECT → APPROVE_TOKEN → BASE_DEPOSIT → PENDING_CONFIRMATION →
CONFIRMING (1/12) → CONFIRMING (6/12) → CONFIRMED → INDEXED → UNIFIED_ESCROW
         ↓                ↓
   WALLET_REJECTED    TX_FAILED → RETRY_DEPOSIT
```

### State Definitions

#### WALLET_CONNECT
- **Entry**: User selects "Pay with Base"
- **Actions**: Connect wallet (MetaMask, Coinbase Wallet, Rainbow)
- **Guards**:
  - Wallet extension installed
  - Network = Base (Chain ID: 8453)
- **Exit**: Wallet connected OR user cancels

#### APPROVE_TOKEN
- **Entry**: Wallet connected, user deposits USDC
- **Actions**: Approve LabBounty contract to spend USDC
- **Guards**:
  - Balance >= bounty amount
  - Gas fees available in ETH
- **Side Effects**: Call `USDC.approve(labBountyContract, amount)`
- **Exit**: Approval confirmed OR rejected

#### BASE_DEPOSIT
- **Entry**: Token approved
- **Actions**: Transfer USDC to escrow contract
- **Guards**:
  - Approval transaction confirmed
  - Sufficient balance + gas
- **Side Effects**:
  ```solidity
  labBountyEscrow.deposit(
    bountyId,
    amount,
    currency: USDC
  )
  ```
- **Exit**: Transaction broadcast

#### PENDING_CONFIRMATION
- **Entry**: Transaction hash received
- **Actions**: Monitor mempool
- **Data**: `{ txHash, timestamp, gasPrice }`
- **Exit**: Included in block OR dropped

#### CONFIRMING (N/12)
- **Entry**: Transaction in block
- **Actions**: Watch for confirmations (need 12 for finality)
- **Guards**: Block not reverted
- **Side Effects**:
  - At 1 conf: Show "Processing"
  - At 6 conf: Show "Almost done"
  - At 12 conf: Move to CONFIRMED
- **Exit**: 12 confirmations OR reorg detected

#### CONFIRMED
- **Entry**: 12 confirmations reached
- **Actions**: Verify on-chain state
- **Guards**: `escrowContract.deposits[bountyId] == amount`
- **Side Effects**:
  - Emit DepositConfirmed event
  - Update DB with tx hash
- **Exit**: Verification passed

#### INDEXED
- **Entry**: Confirmation verified
- **Actions**: Index in database
- **Side Effects**:
  ```typescript
  await db.payments.create({
    bountyId,
    txHash,
    chain: 'base',
    amount,
    currency: 'USDC',
    status: 'confirmed'
  })
  ```
- **Exit**: Move to UNIFIED_ESCROW

#### TX_FAILED
- **Entry**: Transaction reverted or dropped
- **Actions**: Parse error reason
- **Errors**:
  - Insufficient gas
  - Slippage too high
  - Contract paused
- **Exit**: User retries OR cancels

### Failure Handling

**Network Reorg (Rare on Base)**
```
State: CONFIRMING(8/12)
Event: REORG_DETECTED
Action: Reset to PENDING_CONFIRMATION
Retry: Continue monitoring
```

**Stuck Transaction**
```
State: PENDING_CONFIRMATION (>5 min)
Event: TX_STUCK
Action: Suggest gas price increase
User can: Speed up or cancel
```

---

## 2. SOLANA STATE MACHINE

### States
```
WALLET_CONNECT → APPROVE_TRANSACTION → SOL_DEPOSIT → PENDING_SIGNATURE →
CONFIRMING_SOLANA → FINALIZED → UNIFIED_ESCROW
         ↓
   WALLET_REJECTED → TX_FAILED → RETRY
```

### Key Differences from Base

#### CONFIRMING_SOLANA
- **Finality Model**: Solana uses commitment levels
  - **processed** (1-2 sec) - Optimistic
  - **confirmed** (5-10 sec) - Majority stake vote
  - **finalized** (12-15 sec) - Supermajority + 32 slots
- **Actions**: Poll `getSignatureStatuses` API
- **Guards**: Commitment level must reach "finalized"
- **Side Effects**:
  ```typescript
  const status = await connection.getSignatureStatus(signature, {
    searchTransactionHistory: true
  })

  if (status.confirmationStatus === 'finalized') {
    transition(FINALIZED)
  }
  ```

#### SOL_DEPOSIT
- **Program**: Use LabBounty Solana program (Anchor framework)
- **Instructions**:
  ```rust
  pub fn deposit(
    ctx: Context<Deposit>,
    bounty_id: String,
    amount: u64
  ) -> Result<()> {
    // Transfer USDC SPL tokens to escrow PDA
    token::transfer(
      ctx.accounts.transfer_ctx(),
      amount
    )?;

    // Update escrow state
    ctx.accounts.escrow.amount = amount;
    ctx.accounts.escrow.bounty_id = bounty_id;
    ctx.accounts.escrow.status = EscrowStatus::Locked;

    Ok(())
  }
  ```

### Solana-Specific Failures

**Transaction Confirmation Timeout**
```
State: PENDING_SIGNATURE (>60 sec)
Event: TIMEOUT
Action: Check if transaction actually landed
Retry: Query recent blockhash + re-send if needed
```

**Blockhash Expired**
```
State: PENDING_SIGNATURE
Event: BLOCKHASH_NOT_FOUND
Action: Rebuild transaction with fresh blockhash
Retry: Automatic (3 attempts)
```

---

## 3. STRIPE STATE MACHINE

### States
```
CARD_INPUT → STRIPE_VALIDATE → PAYMENT_INTENT → 3DS_CHALLENGE →
STRIPE_PROCESSING → STRIPE_SUCCEEDED → UNIFIED_ESCROW
         ↓                ↓                ↓
   CARD_INVALID    REQUIRES_ACTION   STRIPE_FAILED → RETRY
```

### State Definitions

#### CARD_INPUT
- **Entry**: User selects credit card
- **Actions**: Show Stripe Elements form
- **Data Collected**:
  - Card number (tokenized)
  - Expiry date
  - CVC
  - Billing zip
- **Exit**: Form valid OR user switches payment method

#### STRIPE_VALIDATE
- **Entry**: User clicks "Pay"
- **Actions**: Call Stripe.js `createToken()`
- **Guards**:
  - Card not expired
  - CVC length correct
  - Luhn check passed (client-side)
- **Side Effects**:
  ```typescript
  const {error, token} = await stripe.createToken(cardElement)
  if (error) transition('CARD_INVALID')
  else transition('PAYMENT_INTENT', { token })
  ```

#### PAYMENT_INTENT
- **Entry**: Card validated
- **Actions**: Create Stripe PaymentIntent on backend
- **Server-Side**:
  ```typescript
  const paymentIntent = await stripe.paymentIntents.create({
    amount: bountyAmount * 100, // cents
    currency: 'usd',
    payment_method_types: ['card'],
    metadata: {
      bountyId: bounty.id,
      userId: user.id
    },
    capture_method: 'manual' // Hold funds, don't capture yet
  })
  ```
- **Exit**: PaymentIntent created

#### 3DS_CHALLENGE (if required)
- **Entry**: Bank requires 3D Secure authentication
- **Actions**: Redirect to bank's auth page
- **User Experience**:
  - Modal opens with bank's 3DS page
  - User enters SMS code or biometric
- **Exit**: Auth succeeded OR failed

#### STRIPE_PROCESSING
- **Entry**: 3DS passed (or not required)
- **Actions**: Stripe processes payment
- **Duration**: 2-5 seconds typically
- **Side Effects**: Monitor webhook `payment_intent.succeeded`
- **Exit**: Success OR failure

#### STRIPE_SUCCEEDED
- **Entry**: Payment succeeded
- **Actions**: Confirm funds held (not captured)
- **Guards**: `paymentIntent.status === 'requires_capture'`
- **Side Effects**:
  ```typescript
  await db.payments.create({
    bountyId,
    stripePaymentIntentId: paymentIntent.id,
    amount: bountyAmount,
    status: 'authorized', // NOT captured yet
    captureAt: null // Will capture on milestone completion
  })
  ```
- **Exit**: Move to UNIFIED_ESCROW

### Stripe-Specific Failures

**Insufficient Funds**
```
Event: STRIPE_FAILED
Error: 'card_declined: insufficient_funds'
Action: Show error, suggest alternate payment method
```

**Card Issuer Fraud Block**
```
Event: STRIPE_FAILED
Error: 'card_declined: fraudulent'
Action: Contact support, suggest cryptocurrency
```

**Rate Limited**
```
Event: TOO_MANY_REQUESTS
Action: Exponential backoff (1s, 2s, 4s)
Max Retries: 3
```

---

## 4. UNIFIED ESCROW STATE MACHINE

All payment rails converge here.

### States
```
UNIFIED_ESCROW → LOCKED → AWAITING_MILESTONE → MILESTONE_RELEASED →
PAYOUT_REQUESTED → PAYOUT_PROCESSING → PAYOUT_COMPLETED
         ↓
   DISPUTED → ADMIN_REVIEW → RESOLVED
         ↓
   REFUND_REQUESTED → REFUNDING → REFUNDED
```

### State Definitions

#### UNIFIED_ESCROW
- **Entry**: Payment confirmed on ANY rail
- **Data**:
  ```typescript
  {
    bountyId: string
    paymentRail: 'base' | 'solana' | 'stripe' | 'wire'
    currency: 'USDC' | 'SOL' | 'USD'
    amount: number
    originalTxHash?: string // For blockchain
    stripePaymentIntentId?: string // For Stripe
    wireReferenceNumber?: string // For wire
  }
  ```
- **Actions**: None yet
- **Exit**: Bounty moves to LAB_SELECTED

#### LOCKED
- **Entry**: Bounty state = LAB_SELECTED
- **Actions**: Lock funds for this bounty
- **Guards**: `escrow.amount >= bounty.totalFunding`
- **Side Effects**:
  - If Stripe: Authorize (don't capture)
  - If Blockchain: Already locked in smart contract
  - If Wire: Mark as reserved in bank account
- **Exit**: Contract signed

#### AWAITING_MILESTONE
- **Entry**: Bounty IN_PROGRESS
- **Actions**: Track milestone progress
- **Data**: Current milestone index
- **Exit**: Milestone completed

#### MILESTONE_RELEASED
- **Entry**: Milestone approved by funder
- **Actions**: Release partial payment
- **Amount**: `bounty.milestones[currentIndex].fundingAmount`
- **Side Effects**:
  - Base: Call `escrowContract.releaseMilestone(bountyId, milestoneId)`
  - Solana: Call Solana program `release_milestone`
  - Stripe: Capture partial amount
  - Wire: Initiate ACH transfer
- **Exit**: Funds released

#### PAYOUT_REQUESTED
- **Entry**: All milestones complete
- **Actions**: Calculate final payout
- **Amount**: `total - released - platform_fee`
- **Platform Fee**: 2.5% of total
- **Exit**: Payout processing starts

#### PAYOUT_PROCESSING
- **Entry**: Payout initiated
- **Actions**: Execute transfer to lab
- **Rail-Specific**:
  - **Base**:
    ```solidity
    escrowContract.finalPayout(
      labWallet,
      remainingAmount
    )
    ```
  - **Solana**:
    ```rust
    token::transfer(
      escrow_to_lab_transfer_ctx(),
      remaining_amount
    )
    ```
  - **Stripe**:
    ```typescript
    await stripe.transfers.create({
      amount: remainingAmount,
      currency: 'usd',
      destination: lab.stripeConnectedAccountId
    })
    ```
- **Exit**: Transfer confirmed

#### PAYOUT_COMPLETED
- **Entry**: Transfer confirmed
- **Actions**: Mark as complete
- **Side Effects**:
  - Update lab balance
  - Send receipt
  - Close escrow
- **Terminal State**

---

## 5. DISPUTE RESOLUTION STATE MACHINE

### States
```
ACTIVE_ESCROW → DISPUTE_RAISED → EVIDENCE_COLLECTION →
ADMIN_REVIEW → DECISION_MADE → DISPUTE_RESOLVED
                       ↓
                PARTIAL_REFUND or FULL_PAYOUT or SPLIT_DECISION
```

### State Definitions

#### DISPUTE_RAISED
- **Entry**: Funder OR lab clicks "Raise Dispute"
- **Actions**: Freeze all payments
- **Data**:
  ```typescript
  {
    disputeId: string
    initiator: 'funder' | 'lab'
    reason: string
    evidence: File[]
    timestamp: Date
  }
  ```
- **Guards**: Cannot dispute if already in PAYOUT_COMPLETED
- **Side Effects**:
  - Freeze escrow (blockchain: pause contract, Stripe: hold capture)
  - Notify both parties
  - Create support ticket

#### EVIDENCE_COLLECTION
- **Entry**: Dispute raised
- **Duration**: 7 days
- **Actions**: Both parties submit evidence
- **Evidence Types**:
  - Documents (PDFs, research papers)
  - Chat logs
  - Screenshots
  - Third-party reports
- **Exit**: 7 days passed OR both submit early

#### ADMIN_REVIEW
- **Entry**: Evidence collection complete
- **Actions**: Admin reviews all evidence
- **Duration**: Up to 14 days
- **Tools**: AI summary of evidence (suggestion only)
- **Exit**: Admin makes decision

#### DECISION_MADE
- **Entry**: Admin decides
- **Possible Decisions**:
  1. **Funder Wins**: Full refund
  2. **Lab Wins**: Full payout
  3. **Split**: Partial refund + partial payout
  4. **Platform Error**: Refund + bonus to lab
- **Data**:
  ```typescript
  {
    decision: 'funder' | 'lab' | 'split'
    funderAmount: number
    labAmount: number
    platformFee: number
    reason: string
  }
  ```
- **Exit**: Execute decision

#### DISPUTE_RESOLVED
- **Entry**: Decision executed
- **Actions**: Transfer funds per decision
- **Side Effects**:
  - Update reputations
  - Archive dispute
  - Send final notices
- **Terminal State**

---

## 6. PAYMENT METHOD SELECTION STATE MACHINE

### States
```
METHOD_SELECTION → WALLET_CONNECT or CARD_INPUT
        ↓
   AMOUNT_CONFIRMATION → INITIATE_PAYMENT → (Rail-specific SM)
```

### Guards for Method Selection

```typescript
const canUseBase: Guard = (ctx) => {
  return (
    ctx.bounty.acceptsBlockchain &&
    ctx.user.hasWeb3Wallet
  )
}

const canUseSolana: Guard = (ctx) => {
  return (
    ctx.bounty.acceptsBlockchain &&
    ctx.user.hasSolanaWallet
  )
}

const canUseStripe: Guard = (ctx) => {
  return ctx.bounty.acceptsFiat
}
```

---

## 7. CROSS-RAIL CONVERSION

### Problem
Funder pays in USDC on Base, Lab wants USD in bank account.

### Solution: Automatic Conversion State Machine

```
BASE_CONFIRMED → CONVERSION_REQUESTED → OFF_RAMP_PENDING →
FIAT_CONVERTED → BANK_TRANSFER → COMPLETED
```

#### CONVERSION_REQUESTED
- **Entry**: Payout requested, rails don't match
- **Actions**: Get quote from Circle or Coinbase
- **Quote**:
  ```typescript
  {
    from: { amount: 1000000, currency: 'USDC', chain: 'base' },
    to: { amount: 999500, currency: 'USD' },
    fee: 500,
    rate: 0.9995,
    expires: Date.now() + 30000 // 30 sec
  }
  ```
- **Guards**: Lab has verified bank account
- **Exit**: Accept quote

#### OFF_RAMP_PENDING
- **Entry**: Quote accepted
- **Actions**: Send USDC to off-ramp provider
- **Providers**: Circle, Coinbase Commerce, Wyre
- **API Call**:
  ```typescript
  await circle.transfers.create({
    source: { type: 'blockchain', chain: 'base', address: escrowAddress },
    destination: { type: 'wire', accountNumber: lab.bankAccount },
    amount: { amount: '1000000', currency: 'USD' }
  })
  ```
- **Exit**: Transfer initiated

#### FIAT_CONVERTED
- **Entry**: Circle confirms USD received
- **Actions**: USD held in Circle account
- **Exit**: Initiate bank transfer

#### BANK_TRANSFER
- **Entry**: Circle initiates ACH
- **Duration**: 1-3 business days
- **Exit**: Lab receives USD

---

## 8. IMPLEMENTATION

### Smart Contracts

**Base (Solidity)**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LabBountyEscrow is ReentrancyGuard {
    struct Deposit {
        address funder;
        address token; // USDC address
        uint256 amount;
        uint256 released;
        BountyStatus status;
    }

    enum BountyStatus {
        Deposited,
        Locked,
        InProgress,
        Disputed,
        Completed,
        Refunded
    }

    mapping(string => Deposit) public bounties; // bountyId => Deposit

    event BountyDeposited(string bountyId, address funder, uint256 amount);
    event MilestoneReleased(string bountyId, uint256 amount, address lab);
    event BountyRefunded(string bountyId, uint256 amount);

    function deposit(
        string calldata bountyId,
        address token,
        uint256 amount
    ) external nonReentrant {
        require(bounties[bountyId].amount == 0, "Already deposited");
        require(amount > 0, "Amount must be > 0");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        bounties[bountyId] = Deposit({
            funder: msg.sender,
            token: token,
            amount: amount,
            released: 0,
            status: BountyStatus.Deposited
        });

        emit BountyDeposited(bountyId, msg.sender, amount);
    }

    function releaseMilestone(
        string calldata bountyId,
        address lab,
        uint256 amount
    ) external nonReentrant {
        Deposit storage bounty = bounties[bountyId];
        require(msg.sender == bounty.funder, "Only funder can release");
        require(bounty.status == BountyStatus.InProgress, "Not in progress");
        require(bounty.released + amount <= bounty.amount, "Exceeds total");

        bounty.released += amount;
        IERC20(bounty.token).transfer(lab, amount);

        emit MilestoneReleased(bountyId, amount, lab);
    }

    function refund(string calldata bountyId) external nonReentrant {
        Deposit storage bounty = bounties[bountyId];
        require(msg.sender == bounty.funder, "Only funder can refund");
        require(
            bounty.status == BountyStatus.Deposited ||
            bounty.status == BountyStatus.Disputed,
            "Cannot refund"
        );

        uint256 refundAmount = bounty.amount - bounty.released;
        bounty.status = BountyStatus.Refunded;

        IERC20(bounty.token).transfer(bounty.funder, refundAmount);

        emit BountyRefunded(bountyId, refundAmount);
    }
}
```

**Solana (Anchor/Rust)**
```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("LabBounty111111111111111111111111111111111");

#[program]
pub mod lab_bounty_escrow {
    use super::*;

    pub fn deposit(
        ctx: Context<Deposit>,
        bounty_id: String,
        amount: u64
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        escrow.bounty_id = bounty_id;
        escrow.funder = ctx.accounts.funder.key();
        escrow.amount = amount;
        escrow.released = 0;
        escrow.status = EscrowStatus::Deposited;

        // Transfer USDC to escrow PDA
        token::transfer(
            ctx.accounts.transfer_ctx(),
            amount
        )?;

        Ok(())
    }

    pub fn release_milestone(
        ctx: Context<ReleaseMilestone>,
        milestone_amount: u64
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == EscrowStatus::InProgress,
            ErrorCode::InvalidStatus
        );
        require!(
            ctx.accounts.funder.key() == escrow.funder,
            ErrorCode::Unauthorized
        );
        require!(
            escrow.released + milestone_amount <= escrow.amount,
            ErrorCode::ExceedsTotalAmount
        );

        escrow.released += milestone_amount;

        // Transfer to lab
        let seeds = &[
            b"escrow",
            escrow.bounty_id.as_bytes(),
            &[ctx.bumps.escrow]
        ];
        token::transfer(
            ctx.accounts
                .transfer_ctx()
                .with_signer(&[&seeds[..]]),
            milestone_amount
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(
        init,
        payer = funder,
        space = 8 + Escrow::LEN,
        seeds = [b"escrow", bounty_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub funder_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Escrow {
    pub bounty_id: String,
    pub funder: Pubkey,
    pub amount: u64,
    pub released: u64,
    pub status: EscrowStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum EscrowStatus {
    Deposited,
    Locked,
    InProgress,
    Disputed,
    Completed,
    Refunded,
}
```

---

## 9. SECURITY CONSIDERATIONS

### Front-Running Prevention (Base/Solana)
```typescript
// Use deadline parameter
const deadline = Math.floor(Date.now() / 1000) + 300 // 5 min

await escrowContract.deposit(bountyId, amount, {
  deadline,
  nonce: await getNonce(userAddress) // Prevent replay
})
```

### Re-Entrancy Protection
- All functions use `nonReentrant` modifier (Solidity)
- All functions use checks-effects-interactions pattern

### Rate Limiting (Stripe)
```typescript
const rateLimit = new Map<string, number>()

async function checkRateLimit(userId: string) {
  const count = rateLimit.get(userId) || 0
  if (count > 5) throw new Error('Too many payment attempts')

  rateLimit.set(userId, count + 1)
  setTimeout(() => rateLimit.delete(userId), 60000) // Reset after 1 min
}
```

---

## 10. MONITORING & ALERTING

### Critical Events to Monitor

```typescript
// Blockchain confirmations taking too long
if (currentState === 'PENDING_CONFIRMATION' && elapsedTime > 300000) {
  alert.send({
    level: 'warning',
    message: `Base tx ${txHash} pending for 5+ minutes`,
    bountyId
  })
}

// Stripe payment stuck
if (currentState === 'STRIPE_PROCESSING' && elapsedTime > 60000) {
  alert.send({
    level: 'critical',
    message: `Stripe payment ${paymentIntentId} processing for 1+ min`,
    bountyId
  })
}

// Dispute raised
if (event === 'DISPUTE_RAISED') {
  alert.send({
    level: 'critical',
    message: `Dispute on bounty ${bountyId} by ${initiator}`,
    escalate: ['admin', 'legal']
  })
}
```

This architecture ensures **payment safety across all rails** with proper state management.
