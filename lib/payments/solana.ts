/**
 * SciFlow Solana Payment Integration
 *
 * Handles USDC payments on Solana network for escrow operations.
 * Uses @solana/web3.js and @solana/spl-token for on-chain interactions.
 *
 * PRODUCTION: Requires SOLANA_ESCROW_PROGRAM_ID and SOLANA_PLATFORM_WALLET_PRIVATE_KEY
 */

import {
  Connection,
  PublicKey,
  ParsedTransactionWithMeta,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} from '@solana/web3.js'
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

// Types for Solana integration
export interface SolanaEscrowConfig {
  rpcUrl: string
  escrowProgramId: string
  usdcMint: string
  platformWallet: string
  platformWalletPrivateKey: string
}

export interface SolanaDepositParams {
  bountyId: string
  funderWallet: string
  amount: number // in USDC (6 decimals)
}

export interface SolanaDepositResult {
  success: boolean
  escrowPDA?: string
  depositAddress?: string
  expectedAmount?: number
  error?: string
}

export interface SolanaTransactionParams {
  escrowPDA: string
  amount: number
  recipientWallet?: string
}

export interface SolanaTransactionResult {
  success: boolean
  txHash?: string
  error?: string
}

// Solana USDC Mint addresses
const USDC_MINTS = {
  mainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
}

/**
 * Solana Payment Service
 * Manages USDC escrow operations on Solana
 */
export class SolanaPaymentService {
  private config: SolanaEscrowConfig
  private connection: Connection

  constructor() {
    this.config = {
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      escrowProgramId: process.env.SOLANA_ESCROW_PROGRAM_ID || '',
      usdcMint: process.env.SOLANA_USDC_MINT || USDC_MINTS.mainnet,
      platformWallet: process.env.SOLANA_PLATFORM_WALLET || '',
      platformWalletPrivateKey: process.env.SOLANA_PLATFORM_WALLET_PRIVATE_KEY || '',
    }
    this.connection = new Connection(this.config.rpcUrl, 'confirmed')
  }

  /**
   * Check if Solana payments are configured for deposits (verification only)
   */
  isConfigured(): boolean {
    return !!(
      this.config.escrowProgramId &&
      this.config.platformWallet
    )
  }

  /**
   * Check if Solana payments are configured for releases (requires signing authority)
   */
  isConfiguredForReleases(): boolean {
    return this.isConfigured() && !!this.config.platformWalletPrivateKey
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus(): Record<string, boolean> {
    return {
      rpcUrl: !!this.config.rpcUrl,
      escrowProgramId: !!this.config.escrowProgramId,
      usdcMint: !!this.config.usdcMint,
      platformWallet: !!this.config.platformWallet,
      platformWalletPrivateKey: !!this.config.platformWalletPrivateKey,
    }
  }

  /**
   * Get the platform wallet keypair for signing transactions
   */
  private getPlatformKeypair(): Keypair {
    if (!this.config.platformWalletPrivateKey) {
      throw new Error('Platform wallet private key not configured')
    }
    // Support both base58 and JSON array formats
    try {
      const keyData = JSON.parse(this.config.platformWalletPrivateKey)
      return Keypair.fromSecretKey(new Uint8Array(keyData))
    } catch {
      // Assume base58 encoded
      const bs58 = require('bs58')
      return Keypair.fromSecretKey(bs58.decode(this.config.platformWalletPrivateKey))
    }
  }

  /**
   * Initialize a deposit - generates escrow PDA and deposit instructions
   */
  async initializeDeposit(params: SolanaDepositParams): Promise<SolanaDepositResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Solana escrow not configured. Set SOLANA_ESCROW_PROGRAM_ID and SOLANA_PLATFORM_WALLET.',
      }
    }

    try {
      // In production, this would:
      // 1. Import @solana/web3.js
      // 2. Derive escrow PDA from program
      // 3. Return deposit instructions for frontend to sign

      // For now, generate a deterministic escrow address
      const escrowPDA = this.deriveEscrowPDA(params.bountyId, params.funderWallet)
      const amountInLamports = Math.round(params.amount * 1_000_000) // USDC has 6 decimals

      return {
        success: true,
        escrowPDA,
        depositAddress: this.config.platformWallet,
        expectedAmount: amountInLamports,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize Solana deposit',
      }
    }
  }

  /**
   * Verify a deposit transaction on-chain
   */
  async verifyDeposit(txHash: string, expectedAmount: number): Promise<SolanaTransactionResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Solana not configured' }
    }

    try {
      // Validate transaction hash format (base58, typically 87-88 chars)
      if (!txHash || txHash.length < 32 || txHash.length > 90) {
        return { success: false, error: 'Invalid transaction hash format' }
      }

      // Create connection to Solana RPC
      const connection = new Connection(this.config.rpcUrl, 'confirmed')

      // Fetch the transaction with parsed data
      const transaction = await connection.getParsedTransaction(txHash, {
        maxSupportedTransactionVersion: 0,
      })

      if (!transaction) {
        return { success: false, error: 'Transaction not found on-chain' }
      }

      // Check if transaction was successful
      if (transaction.meta?.err) {
        return { success: false, error: 'Transaction failed on-chain' }
      }

      // Verify the transaction contains a USDC transfer to our platform wallet
      const transferInfo = this.extractUSDCTransfer(transaction)

      if (!transferInfo) {
        return { success: false, error: 'No USDC transfer found in transaction' }
      }

      // Verify destination is our platform wallet
      if (transferInfo.destination !== this.config.platformWallet) {
        return { success: false, error: 'Transfer destination does not match platform wallet' }
      }

      // Verify the token is USDC
      if (transferInfo.mint !== this.config.usdcMint) {
        return { success: false, error: 'Transfer token is not USDC' }
      }

      // Verify amount (with 1% tolerance for fees)
      const tolerance = expectedAmount * 0.01
      if (transferInfo.amount < expectedAmount - tolerance) {
        return {
          success: false,
          error: `Transfer amount ${transferInfo.amount} is less than expected ${expectedAmount}`,
        }
      }

      return {
        success: true,
        txHash,
      }
    } catch (error) {
      console.error('[Solana] Verification error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify deposit',
      }
    }
  }

  /**
   * Extract USDC transfer details from a parsed transaction
   */
  private extractUSDCTransfer(
    transaction: ParsedTransactionWithMeta
  ): { amount: number; destination: string; mint: string } | null {
    try {
      const instructions = transaction.transaction.message.instructions

      for (const instruction of instructions) {
        // Check for SPL Token transfer instruction
        if ('parsed' in instruction && instruction.program === 'spl-token') {
          const parsed = instruction.parsed

          if (parsed.type === 'transfer' || parsed.type === 'transferChecked') {
            const info = parsed.info
            return {
              amount: parseInt(info.amount || info.tokenAmount?.amount || '0', 10),
              destination: info.destination,
              mint: info.mint || this.config.usdcMint,
            }
          }
        }
      }

      // Also check inner instructions
      const innerInstructions = transaction.meta?.innerInstructions || []
      for (const inner of innerInstructions) {
        for (const instruction of inner.instructions) {
          if ('parsed' in instruction && instruction.program === 'spl-token') {
            const parsed = instruction.parsed
            if (parsed.type === 'transfer' || parsed.type === 'transferChecked') {
              const info = parsed.info
              return {
                amount: parseInt(info.amount || info.tokenAmount?.amount || '0', 10),
                destination: info.destination,
                mint: info.mint || this.config.usdcMint,
              }
            }
          }
        }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Release funds from escrow to recipient (milestone payout)
   * Transfers USDC from platform wallet to recipient
   */
  async releaseFunds(params: SolanaTransactionParams): Promise<SolanaTransactionResult> {
    if (!this.isConfiguredForReleases()) {
      return { success: false, error: 'Solana release not configured. Set SOLANA_PLATFORM_WALLET_PRIVATE_KEY.' }
    }

    if (!params.recipientWallet) {
      return { success: false, error: 'Recipient wallet required' }
    }

    try {
      const platformKeypair = this.getPlatformKeypair()
      const recipientPubkey = new PublicKey(params.recipientWallet)
      const usdcMint = new PublicKey(this.config.usdcMint)

      // Get associated token accounts
      const platformAta = await getAssociatedTokenAddress(usdcMint, platformKeypair.publicKey)
      const recipientAta = await getAssociatedTokenAddress(usdcMint, recipientPubkey)

      // Verify platform has sufficient balance
      const platformAccount = await getAccount(this.connection, platformAta)
      const amountInLamports = BigInt(Math.round(params.amount * 1_000_000))

      if (platformAccount.amount < amountInLamports) {
        return {
          success: false,
          error: `Insufficient balance. Required: ${params.amount} USDC, Available: ${Number(platformAccount.amount) / 1_000_000} USDC`,
        }
      }

      // Build transfer instruction
      const transferIx = createTransferInstruction(
        platformAta,
        recipientAta,
        platformKeypair.publicKey,
        amountInLamports,
        [],
        TOKEN_PROGRAM_ID
      )

      // Create and send transaction
      const transaction = new Transaction().add(transferIx)
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [platformKeypair],
        { commitment: 'confirmed' }
      )

      return {
        success: true,
        txHash: signature,
      }
    } catch (error) {
      console.error('[Solana] Release funds error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to release funds',
      }
    }
  }

  /**
   * Refund funds from escrow back to funder
   * Transfers USDC from platform wallet back to the original funder
   */
  async refundFunds(params: SolanaTransactionParams & { funderWallet: string }): Promise<SolanaTransactionResult> {
    if (!this.isConfiguredForReleases()) {
      return { success: false, error: 'Solana refund not configured. Set SOLANA_PLATFORM_WALLET_PRIVATE_KEY.' }
    }

    if (!params.funderWallet) {
      return { success: false, error: 'Funder wallet required for refund' }
    }

    try {
      const platformKeypair = this.getPlatformKeypair()
      const funderPubkey = new PublicKey(params.funderWallet)
      const usdcMint = new PublicKey(this.config.usdcMint)

      // Get associated token accounts
      const platformAta = await getAssociatedTokenAddress(usdcMint, platformKeypair.publicKey)
      const funderAta = await getAssociatedTokenAddress(usdcMint, funderPubkey)

      // Verify platform has sufficient balance
      const platformAccount = await getAccount(this.connection, platformAta)
      const amountInLamports = BigInt(Math.round(params.amount * 1_000_000))

      if (platformAccount.amount < amountInLamports) {
        return {
          success: false,
          error: `Insufficient balance for refund. Required: ${params.amount} USDC`,
        }
      }

      // Build transfer instruction
      const transferIx = createTransferInstruction(
        platformAta,
        funderAta,
        platformKeypair.publicKey,
        amountInLamports,
        [],
        TOKEN_PROGRAM_ID
      )

      // Create and send transaction
      const transaction = new Transaction().add(transferIx)
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [platformKeypair],
        { commitment: 'confirmed' }
      )

      return {
        success: true,
        txHash: signature,
      }
    } catch (error) {
      console.error('[Solana] Refund error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refund funds',
      }
    }
  }

  /**
   * Get platform wallet USDC balance
   */
  async getEscrowBalance(_escrowPDA?: string): Promise<{ balance: number; error?: string }> {
    if (!this.isConfigured()) {
      return { balance: 0, error: 'Solana not configured' }
    }

    try {
      const platformPubkey = new PublicKey(this.config.platformWallet)
      const usdcMint = new PublicKey(this.config.usdcMint)
      const platformAta = await getAssociatedTokenAddress(usdcMint, platformPubkey)

      const account = await getAccount(this.connection, platformAta)
      const balance = Number(account.amount) / 1_000_000 // Convert from lamports

      return { balance }
    } catch (error) {
      // Token account might not exist yet
      if (error instanceof Error && error.message.includes('could not find')) {
        return { balance: 0 }
      }
      return {
        balance: 0,
        error: error instanceof Error ? error.message : 'Failed to get balance',
      }
    }
  }

  /**
   * Derive escrow PDA for a bounty
   * Uses deterministic address derivation based on bounty and funder
   */
  private deriveEscrowPDA(bountyId: string, funderWallet: string): string {
    if (!this.config.escrowProgramId) {
      // Fallback to platform wallet if no escrow program
      return this.config.platformWallet
    }

    try {
      const programId = new PublicKey(this.config.escrowProgramId)
      const funderPubkey = new PublicKey(funderWallet)

      const [pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('escrow'),
          Buffer.from(bountyId),
          funderPubkey.toBuffer(),
        ],
        programId
      )

      return pda.toBase58()
    } catch {
      // Fallback to platform wallet
      return this.config.platformWallet
    }
  }

  /**
   * Get deposit instructions for frontend
   */
  getDepositInstructions(depositAddress: string, amount: number): {
    network: string
    token: string
    address: string
    amount: string
    memo: string
  } {
    return {
      network: 'Solana (Mainnet)',
      token: 'USDC',
      address: depositAddress,
      amount: (amount / 1_000_000).toFixed(2),
      memo: 'SciFlow Bounty Escrow',
    }
  }
}

// Export singleton instance
export const solanaPayment = new SolanaPaymentService()
