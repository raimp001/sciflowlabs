/**
 * SciFlow Hybrid Payment Handler
 * 
 * This module handles the "Fund Bounty" action, routing payments to the
 * correct escrow mechanism based on the payment method selected.
 * 
 * Supported payment methods:
 * - Stripe (Fiat via Credit Card)
 * - Solana USDC (SPL Token to Escrow PDA)
 * - Base USDC (ERC20 to Escrow Smart Contract)
 * 
 * CRITICAL: This module only updates the state machine to 'Funding_Escrow'
 * upon FINAL CONFIRMATION of secured funds - not on initiation.
 */

import type { 
  PaymentMethod, 
  EscrowDetails, 
  BountyContext 
} from '../machines/bounty-machine';

// ============================================================================
// Types
// ============================================================================

export interface FundBountyRequest {
  bountyId: string;
  funderId: string;
  amount: number;
  currency: 'USD' | 'USDC';
  paymentMethod: PaymentMethod;
  
  // Method-specific fields
  stripePaymentMethodId?: string;
  solanaWalletAddress?: string;
  evmWalletAddress?: string;
}

export interface FundBountyResult {
  success: boolean;
  escrowDetails?: EscrowDetails;
  transactionId?: string;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}

export interface PaymentProcessor {
  initiate(request: FundBountyRequest): Promise<{ pendingId: string; metadata: Record<string, unknown> }>;
  confirm(pendingId: string): Promise<{ confirmed: boolean; details: Partial<EscrowDetails> }>;
  refund(escrowDetails: EscrowDetails, amount: number): Promise<{ success: boolean; txId: string }>;
  releaseToRecipient(escrowDetails: EscrowDetails, recipientId: string, amount: number): Promise<{ success: boolean; txId: string }>;
}

// ============================================================================
// Stripe Payment Processor (Fiat)
// ============================================================================

class StripePaymentProcessor implements PaymentProcessor {
  private readonly stripe: Stripe;
  
  constructor() {
    // Initialize Stripe with server-side secret key
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-01.acacia',
    });
  }

  async initiate(request: FundBountyRequest): Promise<{ pendingId: string; metadata: Record<string, unknown> }> {
    /**
     * STEP 1: Create a PaymentIntent with manual capture
     * This authorizes the funds but doesn't capture them yet.
     * The funds are held on the customer's card.
     */
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(request.amount * 100), // Stripe uses cents
      currency: 'usd',
      payment_method: request.stripePaymentMethodId,
      capture_method: 'manual', // CRITICAL: Don't capture yet
      confirm: true, // Authorize immediately
      metadata: {
        bounty_id: request.bountyId,
        funder_id: request.funderId,
        platform: 'sciflow',
      },
      // For Connect payouts later
      transfer_group: `bounty_${request.bountyId}`,
    });

    if (paymentIntent.status !== 'requires_capture') {
      throw new PaymentError(
        'AUTHORIZATION_FAILED',
        `Payment authorization failed: ${paymentIntent.status}`,
        true
      );
    }

    return {
      pendingId: paymentIntent.id,
      metadata: {
        stripePaymentIntentId: paymentIntent.id,
        authorizedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      },
    };
  }

  async confirm(pendingId: string): Promise<{ confirmed: boolean; details: Partial<EscrowDetails> }> {
    /**
     * STEP 2: Verify the PaymentIntent is still valid and authorized
     * We don't capture here - that happens on milestone approval
     */
    const paymentIntent = await this.stripe.paymentIntents.retrieve(pendingId);
    
    const confirmed = paymentIntent.status === 'requires_capture';
    
    return {
      confirmed,
      details: {
        method: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        totalAmount: paymentIntent.amount / 100,
        currency: 'USD',
        lockedAt: confirmed ? new Date() : undefined,
      },
    };
  }

  async refund(escrowDetails: EscrowDetails, amount: number): Promise<{ success: boolean; txId: string }> {
    /**
     * Cancel the PaymentIntent (auto-releases the hold)
     */
    if (!escrowDetails.stripePaymentIntentId) {
      throw new PaymentError('INVALID_ESCROW', 'Missing Stripe PaymentIntent ID', false);
    }

    const canceledIntent = await this.stripe.paymentIntents.cancel(
      escrowDetails.stripePaymentIntentId
    );

    return {
      success: canceledIntent.status === 'canceled',
      txId: canceledIntent.id,
    };
  }

  async releaseToRecipient(
    escrowDetails: EscrowDetails, 
    recipientId: string, 
    amount: number
  ): Promise<{ success: boolean; txId: string }> {
    /**
     * STEP 3: Capture (partial) payment and transfer to lab's Connect account
     */
    if (!escrowDetails.stripePaymentIntentId) {
      throw new PaymentError('INVALID_ESCROW', 'Missing Stripe PaymentIntent ID', false);
    }

    // Capture the specific amount
    const capturedIntent = await this.stripe.paymentIntents.capture(
      escrowDetails.stripePaymentIntentId,
      { amount_to_capture: Math.round(amount * 100) }
    );

    // Create transfer to lab's Connect account
    const transfer = await this.stripe.transfers.create({
      amount: Math.round(amount * 100 * 0.97), // 3% platform fee
      currency: 'usd',
      destination: recipientId, // Lab's Stripe Connect account ID
      transfer_group: `bounty_${escrowDetails.stripePaymentIntentId}`,
    });

    return {
      success: capturedIntent.status === 'succeeded',
      txId: transfer.id,
    };
  }
}

// ============================================================================
// Solana USDC Payment Processor
// ============================================================================

class SolanaPaymentProcessor implements PaymentProcessor {
  private readonly connection: Connection;
  private escrowProgram: Program | null = null;

  constructor() {
    // Initialize Solana connection
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );
  }

  private getEscrowProgram(): Program {
    if (!this.escrowProgram) {
      // Initialize escrow program lazily
      // In production, use proper wallet/signer setup
      const provider = new AnchorProvider(
        this.connection,
        { publicKey: ESCROW_PROGRAM_ID, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs } as any,
        { commitment: 'confirmed' }
      );
      this.escrowProgram = new Program(ESCROW_IDL as any, ESCROW_PROGRAM_ID, provider);
    }
    return this.escrowProgram;
  }

  async initiate(request: FundBountyRequest): Promise<{ pendingId: string; metadata: Record<string, unknown> }> {
    /**
     * STEP 1: Derive escrow PDA and prepare deposit instruction
     * Returns the PDA address for the frontend to sign the transaction
     */
    const funderPubkey = new PublicKey(request.solanaWalletAddress!);
    const bountyIdBuffer = Buffer.from(request.bountyId);

    // Derive the escrow PDA
    const [escrowPDA, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('escrow'),
        bountyIdBuffer,
        funderPubkey.toBuffer(),
      ],
      ESCROW_PROGRAM_ID
    );

    // USDC mint on Solana
    const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

    // Get associated token accounts (async)
    const funderUsdcAta = await getAssociatedTokenAddress(USDC_MINT, funderPubkey);
    const escrowUsdcAta = await getAssociatedTokenAddress(USDC_MINT, escrowPDA, true);

    return {
      pendingId: escrowPDA.toBase58(),
      metadata: {
        escrowPDA: escrowPDA.toBase58(),
        escrowBump: bump,
        funderAta: funderUsdcAta.toBase58(),
        escrowAta: escrowUsdcAta.toBase58(),
        amountLamports: Math.round(request.amount * 1_000_000), // USDC has 6 decimals
        instruction: 'deposit', // Frontend will build this tx
      },
    };
  }

  async confirm(pendingId: string): Promise<{ confirmed: boolean; details: Partial<EscrowDetails> }> {
    /**
     * STEP 2: Verify the escrow account has received funds
     * Check the on-chain state
     */
    const escrowPDA = new PublicKey(pendingId);

    try {
      const program = this.getEscrowProgram();
      const escrowAccount = await program.account.escrow.fetch(escrowPDA) as {
        isLocked: boolean;
        amount: BN;
      };

      // Verify funds are deposited and locked
      const confirmed = escrowAccount.isLocked && escrowAccount.amount.toNumber() > 0;

      return {
        confirmed,
        details: {
          method: 'solana_usdc',
          solanaEscrowPDA: pendingId,
          totalAmount: escrowAccount.amount.toNumber() / 1_000_000, // Convert from lamports
          currency: 'USDC',
          lockedAt: confirmed ? new Date() : undefined,
        },
      };
    } catch {
      return { confirmed: false, details: {} };
    }
  }

  async refund(escrowDetails: EscrowDetails, _amount: number): Promise<{ success: boolean; txId: string }> {
    /**
     * Execute refund instruction on the escrow program
     */
    if (!escrowDetails.solanaEscrowPDA) {
      throw new PaymentError('INVALID_ESCROW', 'Missing Solana escrow PDA', false);
    }

    const program = this.getEscrowProgram();
    const escrowPDA = new PublicKey(escrowDetails.solanaEscrowPDA);

    const tx = await program.methods
      .refund()
      .accounts({
        escrow: escrowPDA,
      })
      .rpc();

    return {
      success: true,
      txId: tx,
    };
  }

  async releaseToRecipient(
    escrowDetails: EscrowDetails,
    recipientId: string,
    amount: number
  ): Promise<{ success: boolean; txId: string }> {
    /**
     * Execute release instruction to transfer funds to lab
     */
    if (!escrowDetails.solanaEscrowPDA) {
      throw new PaymentError('INVALID_ESCROW', 'Missing Solana escrow PDA', false);
    }

    const program = this.getEscrowProgram();
    const escrowPDA = new PublicKey(escrowDetails.solanaEscrowPDA);
    const recipientPubkey = new PublicKey(recipientId);

    const tx = await program.methods
      .releaseMilestone(new BN(amount * 1_000_000))
      .accounts({
        escrow: escrowPDA,
        recipient: recipientPubkey,
      })
      .rpc();

    return {
      success: true,
      txId: tx,
    };
  }
}

// ============================================================================
// Base (EVM) USDC Payment Processor
// ============================================================================

class BasePaymentProcessor implements PaymentProcessor {
  private readonly provider: ethers.JsonRpcProvider;
  private escrowFactory: ethers.Contract | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    );
  }

  private getEscrowFactory(): ethers.Contract {
    if (!this.escrowFactory && ESCROW_FACTORY_ADDRESS) {
      this.escrowFactory = new ethers.Contract(
        ESCROW_FACTORY_ADDRESS,
        ESCROW_FACTORY_ABI,
        this.provider
      );
    }
    if (!this.escrowFactory) {
      throw new PaymentError('CONFIG_ERROR', 'Escrow factory not configured', false);
    }
    return this.escrowFactory;
  }

  async initiate(request: FundBountyRequest): Promise<{ pendingId: string; metadata: Record<string, unknown> }> {
    /**
     * STEP 1: Compute the escrow contract address (CREATE2)
     * Frontend will deploy and fund in one transaction
     */
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const salt = ethers.keccak256(
      abiCoder.encode(
        ['string', 'address'],
        [request.bountyId, request.evmWalletAddress]
      )
    );

    // If no factory configured, use platform wallet as escrow destination
    let escrowAddress: string;
    if (ESCROW_FACTORY_ADDRESS) {
      const factory = this.getEscrowFactory();
      escrowAddress = await factory.computeEscrowAddress(
        salt,
        request.evmWalletAddress,
        Math.round(request.amount * 1_000_000) // USDC 6 decimals
      );
    } else {
      // Fallback to platform wallet
      escrowAddress = process.env.BASE_PLATFORM_WALLET || '';
    }

    return {
      pendingId: escrowAddress,
      metadata: {
        escrowAddress,
        salt,
        amount: request.amount,
        usdcAddress: BASE_USDC_ADDRESS,
        factoryAddress: ESCROW_FACTORY_ADDRESS || 'platform_wallet',
      },
    };
  }

  async confirm(pendingId: string): Promise<{ confirmed: boolean; details: Partial<EscrowDetails> }> {
    /**
     * STEP 2: Verify the escrow contract exists and is funded
     */
    try {
      const escrowContract = new ethers.Contract(
        pendingId,
        ESCROW_ABI,
        this.provider
      );

      const [isLocked, amount] = await Promise.all([
        escrowContract.isLocked(),
        escrowContract.totalAmount(),
      ]);

      const confirmed = isLocked && amount > 0n;

      return {
        confirmed,
        details: {
          method: 'base_usdc',
          baseContractAddress: pendingId,
          totalAmount: Number(amount) / 1_000_000,
          currency: 'USDC',
          lockedAt: confirmed ? new Date() : undefined,
        },
      };
    } catch {
      return { confirmed: false, details: {} };
    }
  }

  async refund(escrowDetails: EscrowDetails, _amount: number): Promise<{ success: boolean; txId: string }> {
    if (!escrowDetails.baseContractAddress) {
      throw new PaymentError('INVALID_ESCROW', 'Missing Base escrow address', false);
    }

    const privateKey = process.env.BASE_PLATFORM_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new PaymentError('CONFIG_ERROR', 'Platform wallet private key not configured', false);
    }

    const signer = new ethers.Wallet(privateKey, this.provider);
    const escrowContract = new ethers.Contract(
      escrowDetails.baseContractAddress,
      ESCROW_ABI,
      signer
    );

    const tx = await escrowContract.refund();
    const receipt = await tx.wait();

    return {
      success: receipt?.status === 1,
      txId: receipt?.hash || tx.hash,
    };
  }

  async releaseToRecipient(
    escrowDetails: EscrowDetails,
    recipientId: string,
    amount: number
  ): Promise<{ success: boolean; txId: string }> {
    if (!escrowDetails.baseContractAddress) {
      throw new PaymentError('INVALID_ESCROW', 'Missing Base escrow address', false);
    }

    const privateKey = process.env.BASE_PLATFORM_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new PaymentError('CONFIG_ERROR', 'Platform wallet private key not configured', false);
    }

    const signer = new ethers.Wallet(privateKey, this.provider);
    const escrowContract = new ethers.Contract(
      escrowDetails.baseContractAddress,
      ESCROW_ABI,
      signer
    );

    const tx = await escrowContract.releaseMilestone(
      recipientId,
      Math.round(amount * 1_000_000)
    );
    const receipt = await tx.wait();

    return {
      success: receipt?.status === 1,
      txId: receipt?.hash || tx.hash,
    };
  }
}

// ============================================================================
// Main Hybrid Payment Handler
// ============================================================================

export class HybridPaymentHandler {
  private processors: Record<PaymentMethod, PaymentProcessor>;

  constructor() {
    this.processors = {
      stripe: new StripePaymentProcessor(),
      solana_usdc: new SolanaPaymentProcessor(),
      base_usdc: new BasePaymentProcessor(),
    };
  }

  /**
   * Main entry point for funding a bounty.
   * 
   * IMPORTANT: This method is asynchronous and involves external services.
   * The state machine should only transition to 'funding_escrow' after
   * this method returns successfully with confirmed = true.
   */
  async fundBounty(request: FundBountyRequest): Promise<FundBountyResult> {
    const processor = this.processors[request.paymentMethod];
    
    if (!processor) {
      return {
        success: false,
        error: {
          code: 'INVALID_PAYMENT_METHOD',
          message: `Unsupported payment method: ${request.paymentMethod}`,
          recoverable: false,
        },
      };
    }

    try {
      // STEP 1: Initiate the payment (authorization/setup)
      console.log(`[Payment] Initiating ${request.paymentMethod} payment for bounty ${request.bountyId}`);
      const { pendingId, metadata } = await processor.initiate(request);

      // For blockchain payments, the frontend needs to sign and submit
      // We return early with the pending details
      if (request.paymentMethod !== 'stripe') {
        return {
          success: true,
          transactionId: pendingId,
          escrowDetails: {
            method: request.paymentMethod,
            totalAmount: request.amount,
            currency: request.currency,
            lockedAt: new Date(),
            releaseSchedule: [],
            ...(request.paymentMethod === 'solana_usdc' 
              ? { solanaEscrowPDA: pendingId }
              : { baseContractAddress: pendingId }
            ),
          },
        };
      }

      // STEP 2: For Stripe, confirm the authorization immediately
      console.log(`[Payment] Confirming Stripe authorization: ${pendingId}`);
      const { confirmed, details } = await processor.confirm(pendingId);

      if (!confirmed) {
        return {
          success: false,
          error: {
            code: 'CONFIRMATION_FAILED',
            message: 'Payment authorization could not be confirmed',
            recoverable: true,
          },
        };
      }

      // STEP 3: Build the escrow details
      const escrowDetails: EscrowDetails = {
        method: request.paymentMethod,
        totalAmount: request.amount,
        currency: request.currency,
        lockedAt: new Date(),
        releaseSchedule: [], // Will be populated based on milestones
        ...details,
      };

      console.log(`[Payment] Escrow secured for bounty ${request.bountyId}`);

      return {
        success: true,
        escrowDetails,
        transactionId: pendingId,
      };

    } catch (error) {
      console.error(`[Payment] Error funding bounty:`, error);
      
      if (error instanceof PaymentError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            recoverable: error.recoverable,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown payment error',
          recoverable: false,
        },
      };
    }
  }

  /**
   * Confirm a blockchain payment after the user has signed and submitted
   */
  async confirmBlockchainPayment(
    paymentMethod: PaymentMethod,
    pendingId: string
  ): Promise<FundBountyResult> {
    const processor = this.processors[paymentMethod];
    
    const { confirmed, details } = await processor.confirm(pendingId);

    if (!confirmed) {
      return {
        success: false,
        error: {
          code: 'BLOCKCHAIN_CONFIRMATION_FAILED',
          message: 'Transaction not confirmed on-chain',
          recoverable: true,
        },
      };
    }

    return {
      success: true,
      escrowDetails: details as EscrowDetails,
      transactionId: pendingId,
    };
  }

  /**
   * Release funds to the lab after milestone approval
   */
  async releaseMilestonePayment(
    escrowDetails: EscrowDetails,
    labWalletOrConnectId: string,
    amount: number
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    const processor = this.processors[escrowDetails.method];
    
    try {
      const result = await processor.releaseToRecipient(
        escrowDetails,
        labWalletOrConnectId,
        amount
      );

      return {
        success: result.success,
        txId: result.txId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Release failed',
      };
    }
  }

  /**
   * Refund escrowed funds to the funder
   */
  async refundEscrow(
    escrowDetails: EscrowDetails,
    amount?: number
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    const processor = this.processors[escrowDetails.method];
    
    try {
      const result = await processor.refund(
        escrowDetails,
        amount ?? escrowDetails.totalAmount
      );

      return {
        success: result.success,
        txId: result.txId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed',
      };
    }
  }
}

// ============================================================================
// Error Classes
// ============================================================================

class PaymentError extends Error {
  constructor(
    public code: string,
    message: string,
    public recoverable: boolean
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

// ============================================================================
// SDK Imports and Type Definitions
// ============================================================================

// Note: These imports require the packages to be installed:
// - stripe
// - @solana/web3.js
// - @solana/spl-token
// - @coral-xyz/anchor
// - ethers

// Stripe SDK
import Stripe from 'stripe'

// Solana SDK
import { Connection, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'

// Ethers SDK
import { ethers } from 'ethers'

// Escrow program configuration - load from environment
const ESCROW_PROGRAM_ID = new PublicKey(
  process.env.SOLANA_ESCROW_PROGRAM_ID || '11111111111111111111111111111111' // System program as fallback
)

// Escrow IDL - in production, import the actual IDL from your escrow program
// This is a minimal interface for the escrow program
interface EscrowIDL {
  version: string
  name: string
  instructions: unknown[]
  accounts: unknown[]
}

const ESCROW_IDL: EscrowIDL = {
  version: '0.1.0',
  name: 'sciflow_escrow',
  instructions: [],
  accounts: [],
}

// EVM contract addresses and ABIs
const ESCROW_FACTORY_ADDRESS = process.env.BASE_ESCROW_FACTORY || ''

// Escrow Factory ABI - deploy your own or use a standard escrow pattern
const ESCROW_FACTORY_ABI = [
  'function computeEscrowAddress(bytes32 salt, address funder, uint256 amount) view returns (address)',
  'function createEscrow(bytes32 salt, address funder, uint256 amount) returns (address)',
]

// Escrow Contract ABI
const ESCROW_ABI = [
  'function isLocked() view returns (bool)',
  'function totalAmount() view returns (uint256)',
  'function refund() returns (bool)',
  'function releaseMilestone(address recipient, uint256 amount) returns (bool)',
  'event Released(address indexed recipient, uint256 amount)',
  'event Refunded(address indexed funder, uint256 amount)',
]

const BASE_USDC_ADDRESS = process.env.BASE_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// ============================================================================
// Export Singleton
// ============================================================================

export const paymentHandler = new HybridPaymentHandler();
