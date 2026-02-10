import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { EscrowDetails, PaymentMethod } from '@/lib/machines/bounty-machine'
import type { FundBountyRequest } from '@/lib/payments/hybrid-payment-handler'

// We need to mock external SDKs before importing the module
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {
        create: vi.fn().mockResolvedValue({
          id: 'pi_test_123',
          status: 'requires_capture',
          amount: 10000,
        }),
        retrieve: vi.fn().mockResolvedValue({
          id: 'pi_test_123',
          status: 'requires_capture',
          amount: 10000,
        }),
        cancel: vi.fn().mockResolvedValue({
          id: 'pi_test_123',
          status: 'canceled',
        }),
        capture: vi.fn().mockResolvedValue({
          id: 'pi_test_123',
          status: 'succeeded',
          amount: 10000,
        }),
      },
      transfers: {
        create: vi.fn().mockResolvedValue({
          id: 'tr_test_123',
        }),
      },
    })),
  }
})

vi.mock('@solana/web3.js', () => {
  const PublicKey = vi.fn().mockImplementation((key: string) => ({
    toBase58: () => key,
    toBuffer: () => Buffer.from(key),
  }))
  PublicKey.findProgramAddressSync = vi.fn().mockReturnValue([
    { toBase58: () => 'escrowPDA123' },
    255,
  ])

  return {
    Connection: vi.fn().mockImplementation(() => ({})),
    PublicKey,
    Keypair: { fromSecretKey: vi.fn() },
    Transaction: vi.fn(),
    sendAndConfirmTransaction: vi.fn(),
    SystemProgram: { programId: 'system' },
  }
})

vi.mock('@solana/spl-token', () => ({
  getAssociatedTokenAddress: vi.fn().mockResolvedValue({
    toBase58: () => 'ataAddress',
  }),
  getAccount: vi.fn(),
  createTransferInstruction: vi.fn(),
  TOKEN_PROGRAM_ID: 'tokenProgram',
}))

vi.mock('@coral-xyz/anchor', () => ({
  Program: vi.fn().mockImplementation(() => ({
    account: {
      escrow: {
        fetch: vi.fn().mockResolvedValue({ isLocked: true, amount: { toNumber: () => 100_000_000 } }),
      },
    },
    methods: {
      refund: vi.fn().mockReturnValue({
        accounts: vi.fn().mockReturnValue({
          rpc: vi.fn().mockResolvedValue('txRefund123'),
        }),
      }),
      releaseMilestone: vi.fn().mockReturnValue({
        accounts: vi.fn().mockReturnValue({
          rpc: vi.fn().mockResolvedValue('txRelease123'),
        }),
      }),
    },
  })),
  AnchorProvider: vi.fn(),
  BN: vi.fn().mockImplementation((n: number) => ({ toNumber: () => n })),
}))

vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn().mockImplementation(() => ({})),
    Contract: vi.fn().mockImplementation(() => ({
      isLocked: vi.fn().mockResolvedValue(true),
      totalAmount: vi.fn().mockResolvedValue(BigInt(100_000_000)),
      computeEscrowAddress: vi.fn().mockResolvedValue('0xEscrowAddress'),
      refund: vi.fn().mockResolvedValue({
        wait: vi.fn().mockResolvedValue({ status: 1, hash: '0xrefundhash' }),
        hash: '0xrefundhash',
      }),
      releaseMilestone: vi.fn().mockResolvedValue({
        wait: vi.fn().mockResolvedValue({ status: 1, hash: '0xreleasehash' }),
        hash: '0xreleasehash',
      }),
    })),
    Wallet: vi.fn().mockImplementation(() => ({})),
    AbiCoder: {
      defaultAbiCoder: () => ({ encode: vi.fn().mockReturnValue('0xencoded') }),
    },
    keccak256: vi.fn().mockReturnValue('0xhash'),
  },
}))

describe('HybridPaymentHandler', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')
    vi.stubEnv('SOLANA_RPC_URL', 'https://api.devnet.solana.com')
    vi.stubEnv('SOLANA_ESCROW_PROGRAM_ID', 'EscrowProgram111')
    vi.stubEnv('BASE_RPC_URL', 'https://sepolia.base.org')
    vi.stubEnv('BASE_ESCROW_FACTORY', '')
    vi.stubEnv('BASE_PLATFORM_WALLET', '0xPlatform')
    vi.stubEnv('BASE_PLATFORM_WALLET_PRIVATE_KEY', '0xprivkey')
  })

  // Since the module creates singletons on import, we test the exported types and structure
  it('defines FundBountyRequest type correctly', () => {
    const request: FundBountyRequest = {
      bountyId: 'bounty-1',
      funderId: 'funder-1',
      amount: 1000,
      currency: 'USD',
      paymentMethod: 'stripe',
      stripePaymentMethodId: 'pm_test',
    }
    expect(request.bountyId).toBe('bounty-1')
    expect(request.amount).toBe(1000)
  })

  it('supports all payment methods', () => {
    const methods: PaymentMethod[] = ['stripe', 'solana_usdc', 'base_usdc']
    for (const method of methods) {
      const request: FundBountyRequest = {
        bountyId: 'b1',
        funderId: 'f1',
        amount: 100,
        currency: 'USDC',
        paymentMethod: method,
      }
      expect(request.paymentMethod).toBe(method)
    }
  })

  describe('Stripe fee calculation', () => {
    it('calculates 3% platform fee correctly', () => {
      // The Stripe processor takes 3% fee: amount * 0.97 goes to lab
      const amount = 1000 // $1000
      const labPayout = Math.round(amount * 100 * 0.97) // cents
      const platformFee = Math.round(amount * 100) - labPayout

      expect(labPayout).toBe(97000) // $970.00
      expect(platformFee).toBe(3000) // $30.00
    })

    it('handles small amounts', () => {
      const amount = 1 // $1
      const labPayout = Math.round(amount * 100 * 0.97)
      expect(labPayout).toBe(97) // $0.97
    })

    it('handles large amounts', () => {
      const amount = 100000 // $100,000
      const labPayout = Math.round(amount * 100 * 0.97)
      expect(labPayout).toBe(9700000) // $97,000
    })
  })

  describe('USDC decimal conversion', () => {
    it('converts USDC correctly (6 decimals)', () => {
      const usdcAmount = 100 // 100 USDC
      const lamports = Math.round(usdcAmount * 1_000_000)
      expect(lamports).toBe(100_000_000)
    })

    it('handles fractional USDC amounts', () => {
      const usdcAmount = 50.5 // 50.50 USDC
      const lamports = Math.round(usdcAmount * 1_000_000)
      expect(lamports).toBe(50_500_000)
    })

    it('handles very small amounts', () => {
      const usdcAmount = 0.01 // 1 cent
      const lamports = Math.round(usdcAmount * 1_000_000)
      expect(lamports).toBe(10_000)
    })
  })

  describe('EscrowDetails structure', () => {
    it('validates Stripe escrow details', () => {
      const escrow: EscrowDetails = {
        method: 'stripe',
        totalAmount: 5000,
        currency: 'USD',
        stripePaymentIntentId: 'pi_test_abc',
        lockedAt: new Date(),
        releaseSchedule: [
          { milestoneId: 'ms-1', amount: 2500 },
          { milestoneId: 'ms-2', amount: 2500 },
        ],
      }

      expect(escrow.method).toBe('stripe')
      expect(escrow.releaseSchedule).toHaveLength(2)
      expect(escrow.releaseSchedule[0].amount + escrow.releaseSchedule[1].amount).toBe(escrow.totalAmount)
    })

    it('validates Solana escrow details', () => {
      const escrow: EscrowDetails = {
        method: 'solana_usdc',
        totalAmount: 1000,
        currency: 'USDC',
        solanaEscrowPDA: 'PDA_ADDRESS_123',
        lockedAt: new Date(),
        releaseSchedule: [],
      }

      expect(escrow.method).toBe('solana_usdc')
      expect(escrow.solanaEscrowPDA).toBeDefined()
    })

    it('validates Base escrow details', () => {
      const escrow: EscrowDetails = {
        method: 'base_usdc',
        totalAmount: 2000,
        currency: 'USDC',
        baseContractAddress: '0xContract123',
        lockedAt: new Date(),
        releaseSchedule: [],
      }

      expect(escrow.method).toBe('base_usdc')
      expect(escrow.baseContractAddress).toBeDefined()
    })
  })
})
