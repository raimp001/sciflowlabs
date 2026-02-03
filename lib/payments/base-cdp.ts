/**
 * SciFlow Base (Coinbase CDP SDK) Payment Integration
 *
 * Handles USDC payments on Base network using Coinbase Developer Platform SDK.
 * Base is an Ethereum L2 built by Coinbase with low fees and fast finality.
 *
 * PRODUCTION: Requires CDP_API_KEY_NAME, CDP_API_KEY_PRIVATE_KEY, and BASE_PLATFORM_WALLET_PRIVATE_KEY
 *
 * @see https://docs.cdp.coinbase.com/
 */

import { ethers } from 'ethers'

// ERC20 Transfer ABI for USDC transfers
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]

// Types for Base/CDP integration
export interface BaseCDPConfig {
  apiKeyName: string
  apiKeyPrivateKey: string
  networkId: 'base-mainnet' | 'base-sepolia'
  usdcContractAddress: string
  escrowContractAddress: string
  platformWallet: string
  platformWalletPrivateKey: string
}

export interface BaseDepositParams {
  bountyId: string
  funderWallet: string
  amount: number // in USDC
}

export interface BaseDepositResult {
  success: boolean
  escrowAddress?: string
  depositAddress?: string
  expectedAmount?: string
  chainId?: number
  error?: string
}

export interface BaseTransactionParams {
  escrowAddress: string
  amount: number
  recipientWallet?: string
}

export interface BaseTransactionResult {
  success: boolean
  txHash?: string
  blockNumber?: number
  error?: string
}

// Base network configuration
const BASE_NETWORKS = {
  mainnet: {
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    explorerUrl: 'https://basescan.org',
  },
  sepolia: {
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
    explorerUrl: 'https://sepolia.basescan.org',
  },
}

/**
 * Base CDP Payment Service
 * Manages USDC escrow operations on Base using Coinbase Developer Platform
 */
export class BaseCDPPaymentService {
  private config: BaseCDPConfig
  private networkConfig: typeof BASE_NETWORKS.mainnet
  private provider: ethers.JsonRpcProvider

  constructor() {
    const networkId = (process.env.BASE_NETWORK || 'base-mainnet') as 'base-mainnet' | 'base-sepolia'
    const network = networkId === 'base-mainnet' ? 'mainnet' : 'sepolia'

    this.config = {
      apiKeyName: process.env.CDP_API_KEY_NAME || '',
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY || '',
      networkId,
      usdcContractAddress: process.env.BASE_USDC_ADDRESS || BASE_NETWORKS[network].usdcAddress,
      escrowContractAddress: process.env.BASE_ESCROW_CONTRACT || '',
      platformWallet: process.env.BASE_PLATFORM_WALLET || '',
      platformWalletPrivateKey: process.env.BASE_PLATFORM_WALLET_PRIVATE_KEY || '',
    }

    this.networkConfig = BASE_NETWORKS[network]
    this.provider = new ethers.JsonRpcProvider(this.networkConfig.rpcUrl)
  }

  /**
   * Check if Base CDP payments are configured for deposits (verification only)
   */
  isConfigured(): boolean {
    return !!(
      this.config.platformWallet &&
      this.config.usdcContractAddress
    )
  }

  /**
   * Check if Base CDP payments are configured for releases (requires signing authority)
   */
  isConfiguredForReleases(): boolean {
    return this.isConfigured() && !!this.config.platformWalletPrivateKey
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus(): Record<string, boolean | string | number> {
    return {
      apiKeyName: !!this.config.apiKeyName,
      apiKeyPrivateKey: !!this.config.apiKeyPrivateKey,
      networkId: this.config.networkId,
      usdcContractAddress: !!this.config.usdcContractAddress,
      escrowContractAddress: !!this.config.escrowContractAddress,
      platformWallet: !!this.config.platformWallet,
      platformWalletPrivateKey: !!this.config.platformWalletPrivateKey,
      chainId: this.networkConfig.chainId,
    }
  }

  /**
   * Get the platform wallet signer for transactions
   */
  private getPlatformSigner(): ethers.Wallet {
    if (!this.config.platformWalletPrivateKey) {
      throw new Error('Platform wallet private key not configured')
    }
    return new ethers.Wallet(this.config.platformWalletPrivateKey, this.provider)
  }

  /**
   * Get USDC contract instance
   */
  private getUsdcContract(signer?: ethers.Wallet): ethers.Contract {
    return new ethers.Contract(
      this.config.usdcContractAddress,
      ERC20_ABI,
      signer || this.provider
    )
  }

  /**
   * Initialize a deposit - generates escrow address
   */
  async initializeDeposit(params: BaseDepositParams): Promise<BaseDepositResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Base CDP not configured. Set CDP_API_KEY_NAME, CDP_API_KEY_PRIVATE_KEY, and BASE_PLATFORM_WALLET.',
      }
    }

    try {
      await this.initializeCDPClient()

      // In production with CDP SDK:
      // 1. Create or get wallet from CDP
      // 2. Derive escrow address using CREATE2 or get deposit address
      
      const escrowAddress = this.deriveEscrowAddress(params.bountyId, params.funderWallet)
      const amountInWei = this.toWei(params.amount, 6) // USDC has 6 decimals

      return {
        success: true,
        escrowAddress,
        depositAddress: this.config.platformWallet,
        expectedAmount: amountInWei,
        chainId: this.networkConfig.chainId,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize Base deposit',
      }
    }
  }

  /**
   * Verify a deposit transaction on-chain
   */
  async verifyDeposit(txHash: string, expectedAmount: number): Promise<BaseTransactionResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Base CDP not configured' }
    }

    try {
      // Validate transaction hash format
      if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
        return { success: false, error: 'Invalid transaction hash format' }
      }

      // Fetch transaction receipt via RPC
      const receipt = await this.fetchTransactionReceipt(txHash)

      if (!receipt) {
        return { success: false, error: 'Transaction not found on-chain' }
      }

      // Check if transaction was successful (status: 0x1)
      if (receipt.status !== '0x1') {
        return { success: false, error: 'Transaction failed on-chain' }
      }

      // Parse Transfer events from the receipt logs
      const transferEvent = this.parseUSDCTransferEvent(receipt.logs)

      if (!transferEvent) {
        return { success: false, error: 'No USDC transfer found in transaction' }
      }

      // Verify destination is our platform wallet
      if (transferEvent.to.toLowerCase() !== this.config.platformWallet.toLowerCase()) {
        return { success: false, error: 'Transfer destination does not match platform wallet' }
      }

      // Verify amount (with 1% tolerance)
      const expectedInWei = BigInt(Math.round(expectedAmount * 1_000_000))
      const tolerance = expectedInWei / 100n
      if (transferEvent.amount < expectedInWei - tolerance) {
        return {
          success: false,
          error: `Transfer amount is less than expected`,
        }
      }

      return {
        success: true,
        txHash,
        blockNumber: parseInt(receipt.blockNumber, 16),
      }
    } catch (error) {
      console.error('[Base] Verification error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify deposit',
      }
    }
  }

  /**
   * Fetch transaction receipt via JSON-RPC
   */
  private async fetchTransactionReceipt(txHash: string): Promise<{
    status: string
    blockNumber: string
    logs: Array<{
      address: string
      topics: string[]
      data: string
    }>
  } | null> {
    try {
      const response = await fetch(this.networkConfig.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        }),
      })

      const result = await response.json()
      return result.result
    } catch {
      return null
    }
  }

  /**
   * Parse USDC Transfer event from transaction logs
   * Transfer event signature: Transfer(address,address,uint256)
   * Topic0: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
   */
  private parseUSDCTransferEvent(
    logs: Array<{ address: string; topics: string[]; data: string }>
  ): { from: string; to: string; amount: bigint } | null {
    const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

    for (const log of logs) {
      // Check if this is a USDC contract event
      if (log.address.toLowerCase() !== this.config.usdcContractAddress.toLowerCase()) {
        continue
      }

      // Check if this is a Transfer event
      if (log.topics[0] !== TRANSFER_TOPIC) {
        continue
      }

      // Parse Transfer event (indexed: from, to; data: amount)
      const from = '0x' + log.topics[1].slice(26)
      const to = '0x' + log.topics[2].slice(26)
      const amount = BigInt(log.data)

      return { from, to, amount }
    }

    return null
  }

  /**
   * Release funds from escrow to recipient (milestone payout)
   * Transfers USDC from platform wallet to recipient
   */
  async releaseFunds(params: BaseTransactionParams): Promise<BaseTransactionResult> {
    if (!this.isConfiguredForReleases()) {
      return { success: false, error: 'Base release not configured. Set BASE_PLATFORM_WALLET_PRIVATE_KEY.' }
    }

    if (!params.recipientWallet) {
      return { success: false, error: 'Recipient wallet required' }
    }

    try {
      const signer = this.getPlatformSigner()
      const usdcContract = this.getUsdcContract(signer)

      // Convert amount to USDC decimals (6 decimals)
      const amountInWei = BigInt(Math.round(params.amount * 1_000_000))

      // Check balance
      const balance = await usdcContract.balanceOf(this.config.platformWallet)
      if (balance < amountInWei) {
        return {
          success: false,
          error: `Insufficient balance. Required: ${params.amount} USDC, Available: ${Number(balance) / 1_000_000} USDC`,
        }
      }

      // Execute transfer
      const tx = await usdcContract.transfer(params.recipientWallet, amountInWei)
      const receipt = await tx.wait()

      return {
        success: receipt.status === 1,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      }
    } catch (error) {
      console.error('[Base] Release funds error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to release funds',
      }
    }
  }

  /**
   * Refund funds from escrow back to funder
   * Transfers USDC from platform wallet back to funder
   */
  async refundFunds(params: BaseTransactionParams & { funderWallet: string }): Promise<BaseTransactionResult> {
    if (!this.isConfiguredForReleases()) {
      return { success: false, error: 'Base refund not configured. Set BASE_PLATFORM_WALLET_PRIVATE_KEY.' }
    }

    if (!params.funderWallet) {
      return { success: false, error: 'Funder wallet required for refund' }
    }

    try {
      const signer = this.getPlatformSigner()
      const usdcContract = this.getUsdcContract(signer)

      // Convert amount to USDC decimals (6 decimals)
      const amountInWei = BigInt(Math.round(params.amount * 1_000_000))

      // Check balance
      const balance = await usdcContract.balanceOf(this.config.platformWallet)
      if (balance < amountInWei) {
        return {
          success: false,
          error: `Insufficient balance for refund. Required: ${params.amount} USDC`,
        }
      }

      // Execute transfer
      const tx = await usdcContract.transfer(params.funderWallet, amountInWei)
      const receipt = await tx.wait()

      return {
        success: receipt.status === 1,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      }
    } catch (error) {
      console.error('[Base] Refund error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refund funds',
      }
    }
  }

  /**
   * Get USDC balance for an address
   */
  async getBalance(address?: string): Promise<{ balance: number; error?: string }> {
    if (!this.isConfigured()) {
      return { balance: 0, error: 'Base CDP not configured' }
    }

    try {
      const targetAddress = address || this.config.platformWallet
      const usdcContract = this.getUsdcContract()
      const balance = await usdcContract.balanceOf(targetAddress)

      return { balance: Number(balance) / 1_000_000 } // Convert from 6 decimals
    } catch (error) {
      return {
        balance: 0,
        error: error instanceof Error ? error.message : 'Failed to get balance',
      }
    }
  }

  /**
   * Create a new wallet address
   * Note: In production, users should create their own wallets via MetaMask/Coinbase Wallet
   * This method is provided for programmatic wallet generation if needed
   */
  async createWallet(_userId: string): Promise<{
    success: boolean
    walletId?: string
    address?: string
    error?: string
  }> {
    // For production, wallet creation should be handled client-side
    // Users connect their existing MetaMask or Coinbase Wallet
    return {
      success: false,
      error: 'Wallet creation should be handled client-side. Users must connect their own wallet (MetaMask/Coinbase Wallet).',
    }
  }

  /**
   * Get deposit instructions for frontend
   */
  getDepositInstructions(depositAddress: string, amount: number): {
    network: string
    chainId: number
    token: string
    tokenContract: string
    address: string
    amount: string
    explorerUrl: string
  } {
    return {
      network: this.config.networkId === 'base-mainnet' ? 'Base (Mainnet)' : 'Base (Sepolia Testnet)',
      chainId: this.networkConfig.chainId,
      token: 'USDC',
      tokenContract: this.config.usdcContractAddress,
      address: depositAddress,
      amount: amount.toFixed(2),
      explorerUrl: this.networkConfig.explorerUrl,
    }
  }

  /**
   * Derive escrow address
   * For now, uses platform wallet as the escrow destination
   * In future, can implement CREATE2 for per-bounty escrow contracts
   */
  private deriveEscrowAddress(_bountyId: string, _funderWallet: string): string {
    // Use platform wallet as escrow destination
    // All funds are tracked in the database by bounty_id
    return this.config.platformWallet
  }

  /**
   * Convert amount to wei (smallest unit)
   */
  private toWei(amount: number, decimals: number): string {
    return (BigInt(Math.round(amount * 10 ** decimals))).toString()
  }

  /**
   * Convert wei to amount
   */
  private fromWei(wei: string | bigint, decimals: number): number {
    return Number(BigInt(wei)) / 10 ** decimals
  }
}

// Export singleton instance
export const baseCDPPayment = new BaseCDPPaymentService()

/**
 * Utility: Format address for display
 */
export function formatAddress(address: string, chars: number = 6): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Utility: Get explorer URL for transaction
 */
export function getExplorerTxUrl(txHash: string, network: 'mainnet' | 'sepolia' = 'mainnet'): string {
  const explorer = BASE_NETWORKS[network].explorerUrl
  return `${explorer}/tx/${txHash}`
}

/**
 * Utility: Get explorer URL for address
 */
export function getExplorerAddressUrl(address: string, network: 'mainnet' | 'sepolia' = 'mainnet'): string {
  const explorer = BASE_NETWORKS[network].explorerUrl
  return `${explorer}/address/${address}`
}
