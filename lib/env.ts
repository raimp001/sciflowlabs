/**
 * Environment variable validation for SciFlow
 *
 * Validates required environment variables are set before the app starts.
 * Optional variables are documented but not enforced.
 */

interface EnvVar {
  key: string
  required: boolean
  description: string
}

const ENV_VARS: EnvVar[] = [
  // Supabase (required for the app to function)
  { key: 'NEXT_PUBLIC_SUPABASE_URL', required: true, description: 'Supabase project URL' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, description: 'Supabase anonymous key' },

  // Stripe (required for fiat payments)
  { key: 'STRIPE_SECRET_KEY', required: false, description: 'Stripe secret key for payment processing' },
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: false, description: 'Stripe publishable key' },
  { key: 'STRIPE_WEBHOOK_SECRET', required: false, description: 'Stripe webhook signing secret' },

  // Solana (required for crypto payments)
  { key: 'SOLANA_RPC_URL', required: false, description: 'Solana RPC endpoint' },
  { key: 'SOLANA_PLATFORM_WALLET', required: false, description: 'Platform wallet for Solana USDC' },
  { key: 'SOLANA_PLATFORM_WALLET_PRIVATE_KEY', required: false, description: 'Platform wallet private key for signing releases' },

  // Base (required for EVM payments)
  { key: 'BASE_PLATFORM_WALLET', required: false, description: 'Platform wallet for Base USDC' },
  { key: 'BASE_PLATFORM_WALLET_PRIVATE_KEY', required: false, description: 'Platform wallet private key for signing releases' },
]

export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key]

    if (!value) {
      if (envVar.required) {
        errors.push(`Missing required env var: ${envVar.key} - ${envVar.description}`)
      } else {
        warnings.push(`Optional env var not set: ${envVar.key} - ${envVar.description}`)
      }
    }
  }

  // Payment method availability checks
  const hasStripe = !!process.env.STRIPE_SECRET_KEY
  const hasSolana = !!process.env.SOLANA_PLATFORM_WALLET
  const hasBase = !!process.env.BASE_PLATFORM_WALLET

  if (!hasStripe && !hasSolana && !hasBase) {
    warnings.push('No payment methods configured. At least one of Stripe, Solana, or Base should be set up.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Log environment status on startup (server-side only)
 */
export function logEnvStatus(): void {
  if (typeof window !== 'undefined') return // Client-side, skip

  const { valid, errors, warnings } = validateEnv()

  if (errors.length > 0) {
    console.error('[SciFlow] Environment validation errors:')
    errors.forEach(e => console.error(`  - ${e}`))
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('[SciFlow] Environment warnings:')
    warnings.forEach(w => console.warn(`  - ${w}`))
  }

  if (valid) {
    console.log('[SciFlow] Environment validation passed')
  }

  // Log payment method availability
  const methods = []
  if (process.env.STRIPE_SECRET_KEY) methods.push('Stripe')
  if (process.env.SOLANA_PLATFORM_WALLET) methods.push('Solana')
  if (process.env.BASE_PLATFORM_WALLET) methods.push('Base')

  if (methods.length > 0) {
    console.log(`[SciFlow] Payment methods available: ${methods.join(', ')}`)
  }
}
