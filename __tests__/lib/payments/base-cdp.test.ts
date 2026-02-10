/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock ethers before imports — use classes so they're constructable with `new`
vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: class MockJsonRpcProvider {},
    Contract: class MockContract {
      balanceOf = vi.fn().mockResolvedValue(BigInt(10_000_000))
      transfer = vi.fn().mockResolvedValue({
        wait: vi.fn().mockResolvedValue({ status: 1, hash: '0xtxhash', blockNumber: 123 }),
      })
    },
    Wallet: class MockWallet {},
    AbiCoder: { defaultAbiCoder: () => ({ encode: vi.fn().mockReturnValue('0xencoded') }) },
    keccak256: vi.fn().mockReturnValue('0xhash'),
  },
}))

// Set env before module import
vi.stubEnv('BASE_NETWORK', 'base-sepolia')
vi.stubEnv('BASE_PLATFORM_WALLET', '0xPlatformWallet123')
vi.stubEnv('BASE_PLATFORM_WALLET_PRIVATE_KEY', '0xprivatekey123')
vi.stubEnv('BASE_USDC_ADDRESS', '0x036CbD53842c5426634e7929541eC2318f3dCF7e')
vi.stubEnv('CDP_API_KEY_NAME', 'test-key')
vi.stubEnv('CDP_API_KEY_PRIVATE_KEY', 'test-private-key')

const {
  BaseCDPPaymentService,
  formatAddress,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} = await import('@/lib/payments/base-cdp')

describe('BaseCDPPaymentService', () => {
  describe('Configuration', () => {
    it('isConfigured returns true when required env vars are set', () => {
      const service = new BaseCDPPaymentService()
      expect(service.isConfigured()).toBe(true)
    })

    it('isConfigured returns false when platform wallet is missing', () => {
      vi.stubEnv('BASE_PLATFORM_WALLET', '')
      const service = new BaseCDPPaymentService()
      expect(service.isConfigured()).toBe(false)
      vi.stubEnv('BASE_PLATFORM_WALLET', '0xPlatformWallet123')
    })

    it('isConfiguredForReleases returns true when private key is set', () => {
      const service = new BaseCDPPaymentService()
      expect(service.isConfiguredForReleases()).toBe(true)
    })

    it('isConfiguredForReleases returns false without private key', () => {
      vi.stubEnv('BASE_PLATFORM_WALLET_PRIVATE_KEY', '')
      const service = new BaseCDPPaymentService()
      expect(service.isConfiguredForReleases()).toBe(false)
      vi.stubEnv('BASE_PLATFORM_WALLET_PRIVATE_KEY', '0xprivatekey123')
    })

    it('getConfigStatus returns correct status for sepolia', () => {
      const service = new BaseCDPPaymentService()
      const status = service.getConfigStatus()
      expect(status.networkId).toBe('base-sepolia')
      expect(status.chainId).toBe(84532)
      expect(status.platformWallet).toBe(true)
    })
  })

  describe('verifyDeposit', () => {
    it('returns error when not configured', async () => {
      vi.stubEnv('BASE_PLATFORM_WALLET', '')
      vi.stubEnv('BASE_USDC_ADDRESS', '')
      const service = new BaseCDPPaymentService()

      const result = await service.verifyDeposit('0xtxhash', 100)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Base CDP not configured')
      vi.stubEnv('BASE_PLATFORM_WALLET', '0xPlatformWallet123')
      vi.stubEnv('BASE_USDC_ADDRESS', '0x036CbD53842c5426634e7929541eC2318f3dCF7e')
    })

    it('rejects invalid transaction hash (not 0x prefixed)', async () => {
      const service = new BaseCDPPaymentService()

      const result = await service.verifyDeposit('notahash', 100)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid transaction hash format')
    })

    it('rejects invalid transaction hash (wrong length)', async () => {
      const service = new BaseCDPPaymentService()

      const result = await service.verifyDeposit('0xshort', 100)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid transaction hash format')
    })

    it('accepts valid transaction hash format', async () => {
      const service = new BaseCDPPaymentService()

      const validHash = '0x' + 'a'.repeat(64)
      const result = await service.verifyDeposit(validHash, 100)
      // Should get past format validation
      expect(result.error).not.toBe('Invalid transaction hash format')
    })
  })

  describe('releaseFunds', () => {
    it('returns error when not configured for releases', async () => {
      vi.stubEnv('BASE_PLATFORM_WALLET_PRIVATE_KEY', '')
      const service = new BaseCDPPaymentService()

      const result = await service.releaseFunds({
        escrowAddress: '0xEscrow',
        amount: 50,
        recipientWallet: '0xRecipient',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not configured')
      vi.stubEnv('BASE_PLATFORM_WALLET_PRIVATE_KEY', '0xprivatekey123')
    })

    it('returns error when recipient wallet is missing', async () => {
      const service = new BaseCDPPaymentService()

      const result = await service.releaseFunds({
        escrowAddress: '0xEscrow',
        amount: 50,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Recipient wallet required')
    })
  })

  describe('refundFunds', () => {
    it('returns error when not configured for releases', async () => {
      vi.stubEnv('BASE_PLATFORM_WALLET_PRIVATE_KEY', '')
      const service = new BaseCDPPaymentService()

      const result = await service.refundFunds({
        escrowAddress: '0xEscrow',
        amount: 50,
        funderWallet: '0xFunder',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not configured')
      vi.stubEnv('BASE_PLATFORM_WALLET_PRIVATE_KEY', '0xprivatekey123')
    })

    it('returns error when funder wallet is missing', async () => {
      const service = new BaseCDPPaymentService()

      const result = await service.refundFunds({
        escrowAddress: '0xEscrow',
        amount: 50,
        funderWallet: '',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Funder wallet required for refund')
    })
  })

  describe('getBalance', () => {
    it('returns error when not configured', async () => {
      vi.stubEnv('BASE_PLATFORM_WALLET', '')
      vi.stubEnv('BASE_USDC_ADDRESS', '')
      const service = new BaseCDPPaymentService()

      const result = await service.getBalance()
      expect(result.balance).toBe(0)
      expect(result.error).toBe('Base CDP not configured')
      vi.stubEnv('BASE_PLATFORM_WALLET', '0xPlatformWallet123')
      vi.stubEnv('BASE_USDC_ADDRESS', '0x036CbD53842c5426634e7929541eC2318f3dCF7e')
    })
  })

  describe('createWallet', () => {
    it('returns error since wallet creation is client-side', async () => {
      const service = new BaseCDPPaymentService()
      const result = await service.createWallet('user-1')
      expect(result.success).toBe(false)
      expect(result.error).toContain('client-side')
    })
  })

  describe('getDepositInstructions', () => {
    it('returns formatted instructions for sepolia', () => {
      const service = new BaseCDPPaymentService()
      const instructions = service.getDepositInstructions('0xAddress', 100)

      expect(instructions.network).toContain('Sepolia')
      expect(instructions.token).toBe('USDC')
      expect(instructions.address).toBe('0xAddress')
      expect(instructions.amount).toBe('100.00')
      expect(instructions.chainId).toBe(84532)
    })
  })
})

describe('Utility Functions', () => {
  describe('formatAddress', () => {
    it('formats address with default chars', () => {
      const formatted = formatAddress('0x1234567890abcdef1234567890abcdef12345678')
      expect(formatted).toBe('0x123456...345678')
    })

    it('formats address with custom chars', () => {
      const formatted = formatAddress('0x1234567890abcdef1234567890abcdef12345678', 4)
      expect(formatted).toBe('0x1234...5678')
    })

    it('returns empty string for empty address', () => {
      expect(formatAddress('')).toBe('')
    })
  })

  describe('getExplorerTxUrl', () => {
    it('generates mainnet explorer URL', () => {
      const url = getExplorerTxUrl('0xtxhash123', 'mainnet')
      expect(url).toBe('https://basescan.org/tx/0xtxhash123')
    })

    it('generates sepolia explorer URL', () => {
      const url = getExplorerTxUrl('0xtxhash456', 'sepolia')
      expect(url).toBe('https://sepolia.basescan.org/tx/0xtxhash456')
    })

    it('defaults to mainnet', () => {
      const url = getExplorerTxUrl('0xtx')
      expect(url).toContain('basescan.org/tx/')
      expect(url).not.toContain('sepolia')
    })
  })

  describe('getExplorerAddressUrl', () => {
    it('generates mainnet explorer URL', () => {
      const url = getExplorerAddressUrl('0xaddr123', 'mainnet')
      expect(url).toBe('https://basescan.org/address/0xaddr123')
    })

    it('generates sepolia explorer URL', () => {
      const url = getExplorerAddressUrl('0xaddr456', 'sepolia')
      expect(url).toBe('https://sepolia.basescan.org/address/0xaddr456')
    })
  })
})
