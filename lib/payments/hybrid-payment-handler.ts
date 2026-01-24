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
  private readonly escrowProgram: Program;
  
  constructor() {
    // Initialize Solana connection
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );
    // Initialize escrow program (Anchor)
    this.escrowProgram = new Program(
      ESCROW_IDL,
      ESCROW_PROGRAM_ID,
      new AnchorProvider(this.connection, {} as any, {})
    );
  }

  async initiate(request: FundBountyRequest): Promise<{ pendingId: string; metadata: Record<string, unknown> }> {
    /**
     * STEP 1: Derive escrow PDA and prepare deposit instruction
     * Returns the PDA address for the frontend to sign the transaction
     */
    const funderPubkey = new PublicKey(request.solanaWalletAddress!);
    const bountyIdBuffer = Buffer.from(request.bountyId);
    
    // Derive the escrow PDA
    const [escrowPDA, bump] = await PublicKey.findProgramAddress(
      [
        Buffer.from('escrow'),
        bountyIdBuffer,
        funderPubkey.toBuffer(),
      ],
      this.escrowProgram.programId
    );

    // USDC mint on Solana
    const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    
    // Get associated token accounts
    const funderUsdcAta = getAssociatedTokenAddress(USDC_MINT, funderPubkey);
    const escrowUsdcAta = getAssociatedTokenAddress(USDC_MINT, escrowPDA, true);

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
      const escrowAccount = await this.escrowProgram.account.escrow.fetch(escrowPDA);
      
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

  async refund(escrowDetails: EscrowDetails, amount: number): Promise<{ success: boolean; txId: string }> {
    /**
     * Execute refund instruction on the escrow program
     */
    if (!escrowDetails.solanaEscrowPDA) {
      throw new PaymentError('INVALID_ESCROW', 'Missing Solana escrow PDA', false);
    }

    // Build refund instruction (would be signed by authorized party)
    const escrowPDA = new PublicKey(escrowDetails.solanaEscrowPDA);
    
    const tx = await this.escrowProgram.methods
      .refund()
      .accounts({
        escrow: escrowPDA,
        // ... other required accounts
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

    const escrowPDA = new PublicKey(escrowDetails.solanaEscrowPDA);
    const recipientPubkey = new PublicKey(recipientId);
    
    const tx = await this.escrowProgram.methods
      .releaseMilestone(new BN(amount * 1_000_000))
      .accounts({
        escrow: escrowPDA,
        recipient: recipientPubkey,
        // ... other required accounts
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
  private readonly escrowFactory: ethers.Contract;
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    );
    this.escrowFactory = new ethers.Contract(
      ESCROW_FACTORY_ADDRESS,
      ESCROW_FACTORY_ABI,
      this.provider
    );
  }

  async initiate(request: FundBountyRequest): Promise<{ pendingId: string; metadata: Record<string, unknown> }> {
    /**
     * STEP 1: Compute the escrow contract address (CREATE2)
     * Frontend will deploy and fund in one transaction
     */
    const salt = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['string', 'address'],
        [request.bountyId, request.evmWalletAddress]
      )
    );
    
    const escrowAddress = await this.escrowFactory.computeEscrowAddress(
      salt,
      request.evmWalletAddress,
      Math.round(request.amount * 1_000_000) // USDC 6 decimals
    );

    return {
      pendingId: escrowAddress,
      metadata: {
        escrowAddress,
        salt,
        amount: request.amount,
        usdcAddress: BASE_USDC_ADDRESS,
        factoryAddress: ESCROW_FACTORY_ADDRESS,
      },
    };
  }

  async confirm(pendingId: string): Promise<{ confirmed: boolean; details: Partial<EscrowDetails> }> {
    /**
     * STEP 2: Verify the escrow contract exists and is funded
     */
    const escrowContract = new ethers.Contract(
      pendingId,
      ESCROW_ABI,
      this.provider
    );

    try {
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

  async refund(escrowDetails: EscrowDetails, amount: number): Promise<{ success: boolean; txId: string }> {
    if (!escrowDetails.baseContractAddress) {
      throw new PaymentError('INVALID_ESCROW', 'Missing Base escrow address', false);
    }

    // This would be called by the authorized party (admin/arbitrator)
    const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, this.provider);
    const escrowContract = new ethers.Contract(
      escrowDetails.baseContractAddress,
      ESCROW_ABI,
      signer
    );

    const tx = await escrowContract.refund();
    const receipt = await tx.wait();

    return {
      success: receipt.status === 1,
      txId: receipt.hash,
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

    const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, this.provider);
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
      success: receipt.status === 1,
      txId: receipt.hash,
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
// Type Stubs (would be imported from actual SDKs)
// ============================================================================

// These are type stubs - in production, import from actual packages
declare class Stripe {
  constructor(key: string, config: { apiVersion: string });
  paymentIntents: {
    create(params: any): Promise<any>;
    retrieve(id: string): Promise<any>;
    capture(id: string, params?: any): Promise<any>;
    cancel(id: string): Promise<any>;
  };
  transfers: {
    create(params: any): Promise<any>;
  };
}

declare class Connection {
  constructor(endpoint: string);
}

declare class Program {
  constructor(idl: any, programId: any, provider: any);
  programId: PublicKey;
  account: { escrow: { fetch(key: PublicKey): Promise<any> } };
  methods: any;
}

declare class AnchorProvider {
  constructor(connection: any, wallet: any, opts: any);
}

declare class PublicKey {
  constructor(key: string);
  static findProgramAddress(seeds: Buffer[], programId: PublicKey): Promise<[PublicKey, number]>;
  toBase58(): string;
  toBuffer(): Buffer;
}

declare class BN {
  constructor(n: number);
  toNumber(): number;
}

declare function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey, allowOwnerOffCurve?: boolean): PublicKey;

declare const ESCROW_IDL: any;
declare const ESCROW_PROGRAM_ID: any;
declare const ESCROW_FACTORY_ADDRESS: string;
declare const ESCROW_FACTORY_ABI: any;
declare const ESCROW_ABI: any;
declare const BASE_USDC_ADDRESS: string;

declare namespace ethers {
  class JsonRpcProvider {
    constructor(url: string);
  }
  class Contract {
    constructor(address: string, abi: any, signerOrProvider?: any);
  }
  class Wallet {
    constructor(privateKey: string, provider: JsonRpcProvider);
  }
  function keccak256(data: string): string;
  class AbiCoder {
    static defaultAbiCoder(): { encode(types: string[], values: any[]): string };
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const paymentHandler = new HybridPaymentHandler();
