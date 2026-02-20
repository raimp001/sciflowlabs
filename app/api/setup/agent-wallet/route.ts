/**
 * Creates the SciFlow agent wallet via Coinbase CDP REST API.
 * Uses Ed25519 JWT signing directly — no SDK ESM issues.
 *
 * Call once: curl "https://sciflowlabs.com/api/setup/agent-wallet?secret=YOUR_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPrivateKey, sign, randomBytes } from 'node:crypto'

export const runtime = 'nodejs'
export const maxDuration = 30

const CDP_BASE = 'https://api.cdp.coinbase.com/platform'

function buildEdDSAJwt(apiKeyName: string, apiKeySecret: string, method: string, path: string) {
  // The CDP private key is a 64-byte raw Ed25519 keypair (seed || public)
  const raw = Buffer.from(apiKeySecret, 'base64')
  const seed = raw.slice(0, 32)

  // Wrap seed in PKCS#8 DER format for Node.js crypto
  const pkcs8Header = Buffer.from('302e020100300506032b657004220420', 'hex')
  const privateKey = createPrivateKey({
    key: Buffer.concat([pkcs8Header, seed]),
    format: 'der',
    type: 'pkcs8',
  })

  const nonce = randomBytes(8).toString('hex')
  const now = Math.floor(Date.now() / 1000)

  const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', kid: apiKeyName, nonce })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: 'cdp',
    sub: apiKeyName,
    nbf: now,
    exp: now + 120,
    uris: [`${method} ${CDP_BASE.replace('https://', '')}${path}`],
  })).toString('base64url')

  const signingInput = `${header}.${payload}`
  const signature = sign(null, Buffer.from(signingInput), privateKey).toString('base64url')

  return `${signingInput}.${signature}`
}

async function cdpRequest(method: string, path: string, body?: unknown) {
  const apiKeyName = process.env.CDP_API_KEY_NAME!
  const apiKeySecret = process.env.CDP_API_KEY_PRIVATE_KEY!

  const jwt = buildEdDSAJwt(apiKeyName, apiKeySecret, method, path)
  const res = await fetch(`${CDP_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'Correlation-Context': `sdk_version=sciflow/1.0,sdk_language=node`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`CDP API ${res.status}: ${text}`)
  return JSON.parse(text)
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (process.env.AGENT_WALLET_DATA) {
    return NextResponse.json({ status: 'already_configured', message: 'Agent wallet already set.' })
  }

  const apiKeyName = process.env.CDP_API_KEY_NAME
  const apiKeySecret = process.env.CDP_API_KEY_PRIVATE_KEY
  if (!apiKeyName || !apiKeySecret) {
    return NextResponse.json({ error: 'CDP keys not in Vercel env' }, { status: 500 })
  }

  // Check if manual wallet data was passed in body
  const body = req.nextUrl.searchParams.get('wallet_id')
  if (body) {
    return NextResponse.json({
      message: 'To manually set wallet data, run:',
      command: `printf '{"wallet_id":"WALLET_ID","seed":"SEED","network_id":"base-mainnet"}' | vercel env add AGENT_WALLET_DATA production --force`,
    })
  }

  try {
    // 1. Create wallet
    const wallet = await cdpRequest('POST', '/v1/wallets', {
      wallet: { network_id: 'base-mainnet' },
    })
    const walletId = wallet.wallet?.id
    if (!walletId) throw new Error('No wallet ID: ' + JSON.stringify(wallet))

    // 2. Create default address
    const addrRes = await cdpRequest('POST', `/v1/wallets/${walletId}/addresses`, {})
    const address = addrRes.address_id

    // 3. Export seed
    const exportRes = await cdpRequest('POST', `/v1/wallets/${walletId}:exportWallet`, {})

    const walletData = JSON.stringify({
      wallet_id: walletId,
      seed: exportRes.seed,
      network_id: 'base-mainnet',
    })

    return NextResponse.json({
      status: 'success',
      address,
      basescan: `https://basescan.org/address/${address}`,
      AGENT_WALLET_DATA: walletData,
      next_steps: [
        '1. Copy AGENT_WALLET_DATA value below',
        "2. Run: printf 'PASTE' | vercel env add AGENT_WALLET_DATA production --force",
        '3. Run: vercel --prod --yes',
        `4. Send USDC to ${address} on Base to fund the agent`,
      ],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isRateLimit = msg.includes('429') || msg.includes('rate_limit') || msg.includes('resource_exhausted')

    return NextResponse.json({
      error: isRateLimit ? 'CDP rate limit hit — try again tomorrow or create wallet manually' : msg,
      keys_valid: true,
      ...(isRateLimit ? {
        manual_option: {
          step1: 'Go to https://portal.cdp.coinbase.com → Wallets → Create Wallet (Base Mainnet)',
          step2: 'Export the wallet seed',
          step3: 'Build AGENT_WALLET_DATA: {"wallet_id":"<id>","seed":"<seed>","network_id":"base-mainnet"}',
          step4: "Run: printf 'VALUE' | vercel env add AGENT_WALLET_DATA production --force",
          step5: 'Run: vercel --prod --yes',
        },
      } : {}),
    }, { status: isRateLimit ? 429 : 500 })
  }
}
