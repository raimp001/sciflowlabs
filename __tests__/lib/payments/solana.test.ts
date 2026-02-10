/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @solana/web3.js before any imports
vi.mock('@solana/web3.js', () => {
  // Use regular function (not arrow) so it's constructable with `new`
  const MockPublicKey = function (this: any, key: string) {
    this.toBase58 = () => key
    this.toBuffer = () => Buffer.from(key)
    this.publicKey = key
  } as any

  MockPublicKey.findProgramAddressSync = vi.fn().mockReturnValue([
    { toBase58: () => 'derivedPDA123' },
    255,
  ])

  return {
    Connection: class MockConnection {
      getParsedTransaction = vi.fn()
    },
    PublicKey: MockPublicKey,
    Keypair: {
      fromSecretKey: vi.fn().mockReturnValue({
        publicKey: { toBase58: () => 'platformPubkey' },
      }),
    },
    Transaction: class MockTransaction {
      add = vi.fn().mockReturnThis()
    },
    sendAndConfirmTransaction: vi.fn().mockResolvedValue('txSignature123'),
    SystemProgram: { programId: 'system' },
  }
})

vi.mock('@solana/spl-token', () => ({
  getAssociatedTokenAddress: vi.fn().mockResolvedValue('ataAddress'),
  getAccount: vi.fn().mockResolvedValue({ amount: BigInt(10_000_000) }),
  createTransferInstruction: vi.fn().mockReturnValue('transferIx'),
  TOKEN_PROGRAM_ID: 'tokenProgram',
}))

// Set env before module import
vi.stubEnv('SOLANA_RPC_URL', 'https://api.devnet.solana.com')
vi.stubEnv('SOLANA_ESCROW_PROGRAM_ID', 'EscrowProgram1111111111111111111111111')
vi.stubEnv('SOLANA_PLATFORM_WALLET', 'PlatformWallet1111111111111111111111')
vi.stubEnv('SOLANA_PLATFORM_WALLET_PRIVATE_KEY', JSON.stringify(Array(64).fill(1)))
vi.stubEnv('SOLANA_USDC_MINT', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

const { SolanaPaymentService } = await import('@/lib/payments/solana')

describe('SolanaPaymentService', () => {
  describe('Configuration', () => {
    it('isConfigured returns true when required env vars are set', () => {
      const service = new SolanaPaymentService()
      expect(service.isConfigured()).toBe(true)
    })

    it('isConfigured returns false when escrow program ID is missing', () => {
      vi.stubEnv('SOLANA_ESCROW_PROGRAM_ID', '')
      const service = new SolanaPaymentService()
      expect(service.isConfigured()).toBe(false)
      vi.stubEnv('SOLANA_ESCROW_PROGRAM_ID', 'EscrowProgram1111111111111111111111111')
    })

    it('isConfigured returns false when platform wallet is missing', () => {
      vi.stubEnv('SOLANA_PLATFORM_WALLET', '')
      const service = new SolanaPaymentService()
      expect(service.isConfigured()).toBe(false)
      vi.stubEnv('SOLANA_PLATFORM_WALLET', 'PlatformWallet1111111111111111111111')
    })

    it('isConfiguredForReleases returns true when private key is set', () => {
      const service = new SolanaPaymentService()
      expect(service.isConfiguredForReleases()).toBe(true)
    })

    it('isConfiguredForReleases returns false without private key', () => {
      vi.stubEnv('SOLANA_PLATFORM_WALLET_PRIVATE_KEY', '')
      const service = new SolanaPaymentService()
      expect(service.isConfiguredForReleases()).toBe(false)
      vi.stubEnv('SOLANA_PLATFORM_WALLET_PRIVATE_KEY', JSON.stringify(Array(64).fill(1)))
    })

    it('getConfigStatus returns correct status map', () => {
      const service = new SolanaPaymentService()
      const status = service.getConfigStatus()
      expect(status.rpcUrl).toBe(true)
      expect(status.escrowProgramId).toBe(true)
      expect(status.platformWallet).toBe(true)
      expect(status.platformWalletPrivateKey).toBe(true)
    })
  })

  describe('initializeDeposit', () => {
    it('returns error when not configured', async () => {
      vi.stubEnv('SOLANA_ESCROW_PROGRAM_ID', '')
      vi.stubEnv('SOLANA_PLATFORM_WALLET', '')
      const service = new SolanaPaymentService()

      const result = await service.initializeDeposit({
        bountyId: 'bounty-1',
        funderWallet: 'FunderWallet111',
        amount: 100,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not configured')
      vi.stubEnv('SOLANA_ESCROW_PROGRAM_ID', 'EscrowProgram1111111111111111111111111')
      vi.stubEnv('SOLANA_PLATFORM_WALLET', 'PlatformWallet1111111111111111111111')
    })

    it('returns escrow PDA and deposit details', async () => {
      const service = new SolanaPaymentService()

      const result = await service.initializeDeposit({
        bountyId: 'bounty-1',
        funderWallet: 'FunderWallet111',
        amount: 100,
      })

      expect(result.success).toBe(true)
      expect(result.escrowPDA).toBeDefined()
      expect(result.depositAddress).toBe('PlatformWallet1111111111111111111111')
      expect(result.expectedAmount).toBe(100_000_000)
    })

    it('converts USDC amount correctly (6 decimals)', async () => {
      const service = new SolanaPaymentService()

      const result = await service.initializeDeposit({
        bountyId: 'bounty-1',
        funderWallet: 'FunderWallet111',
        amount: 50.5,
      })

      expect(result.expectedAmount).toBe(50_500_000)
    })
  })

  describe('verifyDeposit', () => {
    it('returns error when not configured', async () => {
      vi.stubEnv('SOLANA_ESCROW_PROGRAM_ID', '')
      vi.stubEnv('SOLANA_PLATFORM_WALLET', '')
      const service = new SolanaPaymentService()

      const result = await service.verifyDeposit('txhash123456789012345678901234567890', 100)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Solana not configured')
      vi.stubEnv('SOLANA_ESCROW_PROGRAM_ID', 'EscrowProgram1111111111111111111111111')
      vi.stubEnv('SOLANA_PLATFORM_WALLET', 'PlatformWallet1111111111111111111111')
    })

    it('rejects invalid transaction hash (too short)', async () => {
      const service = new SolanaPaymentService()

      const result = await service.verifyDeposit('short', 100)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid transaction hash format')
    })

    it('rejects invalid transaction hash (too long)', async () => {
      const service = new SolanaPaymentService()

      const result = await service.verifyDeposit('x'.repeat(100), 100)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid transaction hash format')
    })
  })

  describe('releaseFunds', () => {
    it('returns error when not configured for releases', async () => {
      vi.stubEnv('SOLANA_PLATFORM_WALLET_PRIVATE_KEY', '')
      const service = new SolanaPaymentService()

      const result = await service.releaseFunds({
        escrowPDA: 'pda123',
        amount: 50,
        recipientWallet: 'recipient123',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not configured')
      vi.stubEnv('SOLANA_PLATFORM_WALLET_PRIVATE_KEY', JSON.stringify(Array(64).fill(1)))
    })

    it('returns error when recipient wallet is missing', async () => {
      const service = new SolanaPaymentService()

      const result = await service.releaseFunds({
        escrowPDA: 'pda123',
        amount: 50,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Recipient wallet required')
    })
  })

  describe('refundFunds', () => {
    it('returns error when not configured for releases', async () => {
      vi.stubEnv('SOLANA_PLATFORM_WALLET_PRIVATE_KEY', '')
      const service = new SolanaPaymentService()

      const result = await service.refundFunds({
        escrowPDA: 'pda123',
        amount: 50,
        funderWallet: 'funder123',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not configured')
      vi.stubEnv('SOLANA_PLATFORM_WALLET_PRIVATE_KEY', JSON.stringify(Array(64).fill(1)))
    })

    it('returns error when funder wallet is missing', async () => {
      const service = new SolanaPaymentService()

      const result = await service.refundFunds({
        escrowPDA: 'pda123',
        amount: 50,
        funderWallet: '',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Funder wallet required for refund')
    })
  })

  describe('getEscrowBalance', () => {
    it('returns error when not configured', async () => {
      vi.stubEnv('SOLANA_ESCROW_PROGRAM_ID', '')
      vi.stubEnv('SOLANA_PLATFORM_WALLET', '')
      const service = new SolanaPaymentService()

      const result = await service.getEscrowBalance()
      expect(result.balance).toBe(0)
      expect(result.error).toBe('Solana not configured')
      vi.stubEnv('SOLANA_ESCROW_PROGRAM_ID', 'EscrowProgram1111111111111111111111111')
      vi.stubEnv('SOLANA_PLATFORM_WALLET', 'PlatformWallet1111111111111111111111')
    })
  })

  describe('getDepositInstructions', () => {
    it('returns formatted deposit instructions', () => {
      const service = new SolanaPaymentService()

      const instructions = service.getDepositInstructions('SomeAddress', 5_000_000)
      expect(instructions.network).toBe('Solana (Mainnet)')
      expect(instructions.token).toBe('USDC')
      expect(instructions.address).toBe('SomeAddress')
      expect(instructions.amount).toBe('5.00')
      expect(instructions.memo).toBe('SciFlow Bounty Escrow')
    })
  })
})
