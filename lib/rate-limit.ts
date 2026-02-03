/**
 * Simple in-memory rate limiting for API routes
 *
 * For production, consider using:
 * - Redis-based rate limiting (upstash/ratelimit)
 * - Vercel Edge Config
 * - Cloudflare Rate Limiting
 */

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Max requests per interval
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const key = identifier

  let entry = rateLimitStore.get(key)

  // Create new entry if none exists or if the window has expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.interval,
    }
    rateLimitStore.set(key, entry)
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    }
  }

  // Increment counter
  entry.count++

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Default: 100 requests per minute
  default: { interval: 60000, maxRequests: 100 },

  // Auth endpoints: 10 requests per minute
  auth: { interval: 60000, maxRequests: 10 },

  // Payment endpoints: 20 requests per minute
  payment: { interval: 60000, maxRequests: 20 },

  // Write operations: 30 requests per minute
  write: { interval: 60000, maxRequests: 30 },

  // Search/read: 200 requests per minute
  read: { interval: 60000, maxRequests: 200 },

  // Strict: 5 requests per minute (for sensitive operations)
  strict: { interval: 60000, maxRequests: 5 },
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header (for proxied requests) or falls back to a default
 */
export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback for local development
  return 'anonymous'
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(
  remaining: number,
  resetIn: number
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000)),
  }
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 *
 * Usage:
 * ```
 * import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
 *
 * export const POST = withRateLimit(
 *   async (request) => {
 *     // Your handler logic
 *   },
 *   rateLimitConfigs.payment
 * )
 * ```
 */
export function withRateLimit<T extends Request>(
  handler: (request: T) => Promise<Response>,
  config: RateLimitConfig = rateLimitConfigs.default
): (request: T) => Promise<Response> {
  return async (request: T) => {
    const identifier = getClientIdentifier(request)
    const { allowed, remaining, resetIn } = checkRateLimit(identifier, config)

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.ceil(resetIn / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(resetIn / 1000)),
            ...createRateLimitHeaders(remaining, resetIn),
          },
        }
      )
    }

    const response = await handler(request)

    // Add rate limit headers to response
    const headers = new Headers(response.headers)
    const rateLimitHeaders = createRateLimitHeaders(remaining, resetIn)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      headers.set(key, value)
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}
