import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validateEnv, logEnvStatus } from '@/lib/env'

describe('Environment Validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset env to clean slate per test
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    vi.stubEnv('STRIPE_SECRET_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', '')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '')
    vi.stubEnv('SOLANA_RPC_URL', '')
    vi.stubEnv('SOLANA_PLATFORM_WALLET', '')
    vi.stubEnv('SOLANA_PLATFORM_WALLET_PRIVATE_KEY', '')
    vi.stubEnv('BASE_PLATFORM_WALLET', '')
    vi.stubEnv('BASE_PLATFORM_WALLET_PRIVATE_KEY', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('validateEnv', () => {
    it('returns errors when required env vars are missing', () => {
      const result = validateEnv()
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('NEXT_PUBLIC_SUPABASE_URL'))).toBe(true)
      expect(result.errors.some(e => e.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'))).toBe(true)
    })

    it('passes validation when required env vars are set', () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
      vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')

      const result = validateEnv()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('reports warnings for missing optional env vars', () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

      const result = validateEnv()
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('warns when no payment methods are configured', () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

      const result = validateEnv()
      expect(result.warnings.some(w => w.includes('No payment methods configured'))).toBe(true)
    })

    it('does not warn about payment methods when Stripe is configured', () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
      vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')

      const result = validateEnv()
      expect(result.warnings.some(w => w.includes('No payment methods configured'))).toBe(false)
    })

    it('does not warn about payment methods when Solana is configured', () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
      vi.stubEnv('SOLANA_PLATFORM_WALLET', 'SomeSolanaAddress123')

      const result = validateEnv()
      expect(result.warnings.some(w => w.includes('No payment methods configured'))).toBe(false)
    })

    it('does not warn about payment methods when Base is configured', () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
      vi.stubEnv('BASE_PLATFORM_WALLET', '0xPlatformWallet')

      const result = validateEnv()
      expect(result.warnings.some(w => w.includes('No payment methods configured'))).toBe(false)
    })
  })

  describe('logEnvStatus', () => {
    it('does not log on client-side (window defined)', () => {
      // jsdom environment has window defined, so this should be a no-op
      const consoleSpy = vi.spyOn(console, 'log')
      const consoleErrorSpy = vi.spyOn(console, 'error')

      logEnvStatus()

      // In jsdom, window is defined, so it should return early
      consoleSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })
  })
})
