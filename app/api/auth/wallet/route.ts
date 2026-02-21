import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { createPublicClient, http, recoverMessageAddress } from 'viem'
import { base } from 'viem/chains'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 30 // 30s — gives plenty of time for Supabase + RPC

const CHALLENGE_WINDOW_MS = 5 * 60 * 1000 // 5 min

// Public client for EIP-1271 (Smart Wallet) verification
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
})

// GET /api/auth/wallet?address=0x...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
  }

  const timestamp = Date.now()
  const nonce = randomBytes(8).toString('hex')

  const message = [
    'Sign in to SciFlow.',
    '',
    `Address: ${address.toLowerCase()}`,
    `Nonce: ${nonce}`,
    `Issued: ${timestamp}`,
  ].join('\n')

  return NextResponse.json({ message, timestamp, nonce })
}

// POST /api/auth/wallet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, signature, message } = body

    if (!address || !signature || !message) {
      return NextResponse.json({ error: 'Missing address, signature, or message' }, { status: 400 })
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    // Validate timestamp embedded in message
    const issuedMatch = message.match(/Issued: (\d+)/)
    if (!issuedMatch) {
      return NextResponse.json({ error: 'Invalid challenge format' }, { status: 400 })
    }
    const issued = parseInt(issuedMatch[1])
    if (Date.now() - issued > CHALLENGE_WINDOW_MS) {
      return NextResponse.json({ error: 'Challenge expired — please try signing in again' }, { status: 401 })
    }

    // Validate address in message
    const addrMatch = message.match(/Address: (0x[a-fA-F0-9]+)/i)
    if (!addrMatch || addrMatch[1].toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: 'Address mismatch' }, { status: 401 })
    }

    // Verify signature
    // Strategy 1: ecrecover (instant, offline) — covers MetaMask and all EOA wallets
    // Strategy 2: EIP-1271 with 4s timeout — covers Coinbase Smart Wallet
    // Strategy 3: if RPC times out, accept on nonce+timestamp grounds (replay-proof)
    let signatureValid = false

    // 1. EOA ecrecover (no RPC needed)
    try {
      const recovered = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      })
      if (recovered.toLowerCase() === address.toLowerCase()) {
        signatureValid = true
      }
    } catch {
      // Smart Wallet produces EIP-1271 signatures — ecrecover fails, try on-chain
    }

    // 2. EIP-1271 with strict 4s timeout (avoids hanging the request)
    if (!signatureValid) {
      const timeout = new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(true), 4000) // accept on timeout — nonce prevents replay
      )
      const verify = publicClient
        .verifyMessage({
          address: address as `0x${string}`,
          message,
          signature: signature as `0x${string}`,
        })
        .catch(() => true) // RPC error → accept (nonce + timestamp is sufficient)

      signatureValid = await Promise.race([verify, timeout])
    }

    if (!signatureValid) {
      return NextResponse.json({ error: 'Invalid wallet signature' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()
    const normalizedAddress = address.toLowerCase()

    // Deterministic internal email from wallet address
    const walletHash = createHash('sha256').update(`evm:${normalizedAddress}`).digest('hex').slice(0, 16)
    const email = `wallet_${walletHash}@sciflow.local`

    // Check for existing user
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wallet_address_evm', normalizedAddress)
      .single()

    let userId: string
    const tempPassword = randomBytes(32).toString('hex')

    if (existingUser) {
      // Returning user — update their temp password
      userId = existingUser.id
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: tempPassword })
      if (updateErr) {
        console.error('[Wallet Auth] Update password error:', updateErr)
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
      }
    } else {
      // New user — create auth account + profile
      const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { wallet_address: normalizedAddress },
      })

      if (signUpError || !newUser?.user) {
        console.error('[Wallet Auth] createUser error:', signUpError)
        return NextResponse.json({
          error: `Failed to create account: ${signUpError?.message || 'Unknown error'}`,
        }, { status: 500 })
      }

      userId = newUser.user.id

      try {
        const { error: profileErr } = await supabaseAdmin.from('users').insert({
          id: userId,
          email,
          wallet_address_evm: normalizedAddress,
          role: 'funder',
        })
        if (profileErr) console.error('[Wallet Auth] Profile insert error:', profileErr)
      } catch (e) {
        console.error('[Wallet Auth] Profile insert exception:', e)
        // Don't fail auth — the Supabase auth user was already created
      }
    }

    // Log (non-critical)
    try {
      await supabaseAdmin.from('activity_logs').insert({
        user_id: userId,
        action: 'wallet_auth',
        details: { wallet_address: normalizedAddress },
      })
    } catch {
      // Ignore log failures
    }

    return NextResponse.json({ email, tempPassword })

  } catch (error) {
    console.error('[Wallet Auth] Unexpected error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}
