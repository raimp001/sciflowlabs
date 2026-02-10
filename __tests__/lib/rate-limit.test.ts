import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkRateLimit,
  rateLimitConfigs,
  getClientIdentifier,
  createRateLimitHeaders,
  withRateLimit,
} from '@/lib/rate-limit'

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Use unique identifiers per test to avoid cross-contamination
    // since the rate limit store persists across tests
  })

  describe('checkRateLimit', () => {
    it('allows requests within the limit', () => {
      const id = `test-allow-${Date.now()}`
      const config = { interval: 60000, maxRequests: 5 }

      const result = checkRateLimit(id, config)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4) // 5 - 1 (current request)
      expect(result.resetIn).toBeGreaterThan(0)
    })

    it('decrements remaining count with each request', () => {
      const id = `test-decrement-${Date.now()}`
      const config = { interval: 60000, maxRequests: 3 }

      expect(checkRateLimit(id, config).remaining).toBe(2)
      expect(checkRateLimit(id, config).remaining).toBe(1)
      expect(checkRateLimit(id, config).remaining).toBe(0)
    })

    it('blocks requests when limit is exceeded', () => {
      const id = `test-block-${Date.now()}`
      const config = { interval: 60000, maxRequests: 2 }

      checkRateLimit(id, config) // 1
      checkRateLimit(id, config) // 2

      const result = checkRateLimit(id, config) // 3 - should be blocked
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.resetIn).toBeGreaterThan(0)
    })

    it('uses separate counters for different identifiers', () => {
      const config = { interval: 60000, maxRequests: 1 }

      const id1 = `test-sep-a-${Date.now()}`
      const id2 = `test-sep-b-${Date.now()}`

      checkRateLimit(id1, config) // Exhaust id1's limit
      const result1 = checkRateLimit(id1, config)
      expect(result1.allowed).toBe(false)

      // id2 should still have requests available
      const result2 = checkRateLimit(id2, config)
      expect(result2.allowed).toBe(true)
    })

    it('resets counter after window expires', () => {
      vi.useFakeTimers()
      const id = `test-reset-${Date.now()}`
      const config = { interval: 1000, maxRequests: 1 }

      checkRateLimit(id, config) // Use up the limit
      expect(checkRateLimit(id, config).allowed).toBe(false)

      // Advance past the window
      vi.advanceTimersByTime(1100)

      const result = checkRateLimit(id, config)
      expect(result.allowed).toBe(true)

      vi.useRealTimers()
    })

    it('returns correct resetIn time', () => {
      vi.useFakeTimers()
      const id = `test-resetin-${Date.now()}`
      const config = { interval: 60000, maxRequests: 10 }

      const result = checkRateLimit(id, config)
      // resetIn should be approximately equal to the interval
      expect(result.resetIn).toBeGreaterThan(59000)
      expect(result.resetIn).toBeLessThanOrEqual(60000)

      vi.useRealTimers()
    })
  })

  describe('rateLimitConfigs', () => {
    it('has all expected preset configurations', () => {
      expect(rateLimitConfigs.default).toEqual({ interval: 60000, maxRequests: 100 })
      expect(rateLimitConfigs.auth).toEqual({ interval: 60000, maxRequests: 10 })
      expect(rateLimitConfigs.payment).toEqual({ interval: 60000, maxRequests: 20 })
      expect(rateLimitConfigs.write).toEqual({ interval: 60000, maxRequests: 30 })
      expect(rateLimitConfigs.read).toEqual({ interval: 60000, maxRequests: 200 })
      expect(rateLimitConfigs.strict).toEqual({ interval: 60000, maxRequests: 5 })
    })

    it('auth is more restrictive than default', () => {
      expect(rateLimitConfigs.auth.maxRequests).toBeLessThan(rateLimitConfigs.default.maxRequests)
    })

    it('strict is the most restrictive', () => {
      const configs = Object.values(rateLimitConfigs)
      const strictMax = rateLimitConfigs.strict.maxRequests
      for (const config of configs) {
        expect(strictMax).toBeLessThanOrEqual(config.maxRequests)
      }
    })
  })

  describe('getClientIdentifier', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      })
      expect(getClientIdentifier(request)).toBe('192.168.1.1')
    })

    it('extracts IP from x-real-ip header', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-real-ip': '10.0.0.5' },
      })
      expect(getClientIdentifier(request)).toBe('10.0.0.5')
    })

    it('prefers x-forwarded-for over x-real-ip', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '1.1.1.1',
          'x-real-ip': '2.2.2.2',
        },
      })
      expect(getClientIdentifier(request)).toBe('1.1.1.1')
    })

    it('falls back to anonymous when no headers present', () => {
      const request = new Request('https://example.com')
      expect(getClientIdentifier(request)).toBe('anonymous')
    })

    it('trims whitespace from forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1' },
      })
      expect(getClientIdentifier(request)).toBe('192.168.1.1')
    })
  })

  describe('createRateLimitHeaders', () => {
    it('creates correct headers', () => {
      const headers = createRateLimitHeaders(5, 30000)
      expect(headers['X-RateLimit-Remaining']).toBe('5')
      expect(headers['X-RateLimit-Reset']).toBe('30') // 30000ms = 30s
    })

    it('rounds up reset time', () => {
      const headers = createRateLimitHeaders(0, 1500)
      expect(headers['X-RateLimit-Reset']).toBe('2') // ceil(1.5) = 2
    })

    it('handles zero remaining', () => {
      const headers = createRateLimitHeaders(0, 60000)
      expect(headers['X-RateLimit-Remaining']).toBe('0')
    })
  })

  describe('withRateLimit', () => {
    it('passes through when not rate limited', async () => {
      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )

      const wrappedHandler = withRateLimit(handler, { interval: 60000, maxRequests: 100 })
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': `pass-${Date.now()}` },
      })

      const response = await wrappedHandler(request)
      expect(response.status).toBe(200)
      expect(handler).toHaveBeenCalled()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy()
    })

    it('returns 429 when rate limited', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('ok'))
      const ip = `limited-${Date.now()}`
      const wrappedHandler = withRateLimit(handler, { interval: 60000, maxRequests: 1 })

      // First request
      const req1 = new Request('https://example.com', {
        headers: { 'x-forwarded-for': ip },
      })
      await wrappedHandler(req1)

      // Second request — should be rate limited
      const req2 = new Request('https://example.com', {
        headers: { 'x-forwarded-for': ip },
      })
      const response = await wrappedHandler(req2)

      expect(response.status).toBe(429)
      const body = await response.json()
      expect(body.error).toBe('Too many requests')
      expect(body.retryAfter).toBeGreaterThan(0)
      expect(response.headers.get('Retry-After')).toBeTruthy()
    })

    it('uses default config when none provided', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('ok'))
      const wrappedHandler = withRateLimit(handler)
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': `default-${Date.now()}` },
      })

      const response = await wrappedHandler(request)
      expect(response.status).toBe(200)
    })
  })
})
