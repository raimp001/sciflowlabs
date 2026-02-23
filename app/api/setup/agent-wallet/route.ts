/**
 * Creates the SciFlow agent wallet via Coinbase CDP REST API.
 * Uses direct JWT signing to avoid SDK bundling/runtime issues.
 *
 * Call once: curl "https://sciflowlabs.com/api/setup/agent-wallet?secret=YOUR_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  createPrivateKey,
  createSign,
  randomBytes,
  sign as signDetached,
  type KeyObject,
} from 'node:crypto'

export const runtime = 'nodejs'
export const maxDuration = 30

const CDP_BASE = 'https://api.cdp.coinbase.com/platform'
const ED25519_PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex')

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getPath(source: unknown, path: string[]): unknown {
  let current: unknown = source
  for (const segment of path) {
    if (!isRecord(current)) return undefined
    current = current[segment]
  }
  return current
}

function pickString(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }
  return null
}

function parseExistingWalletData(raw: string): { wallet_id: string; seed: string } | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null

    const walletId = pickString(parsed.wallet_id, parsed.walletId)
    const seed = pickString(parsed.seed)
    if (!walletId || !seed) return null

    return { wallet_id: walletId, seed }
  } catch {
    return null
  }
}

function parseCdpPrivateKey(apiKeySecret: string): KeyObject {
  const normalized = apiKeySecret.replace(/\\n/g, '\n').trim()

  if (
    normalized.includes('-----BEGIN PRIVATE KEY-----') ||
    normalized.includes('-----BEGIN EC PRIVATE KEY-----')
  ) {
    return createPrivateKey({ key: normalized, format: 'pem' })
  }

  const compact = normalized.replace(/\s+/g, '')
  const maybeBase64 = /^[A-Za-z0-9+/=_-]+$/.test(compact)
  if (!maybeBase64) {
    throw new Error('Unsupported CDP private key format')
  }

  const paddedBase64 = compact.replace(/-/g, '+').replace(/_/g, '/')
  const raw = Buffer.from(paddedBase64, 'base64')
  if (raw.length === 0) {
    throw new Error('Unsupported CDP private key format')
  }

  if (raw.length === 32 || raw.length === 64) {
    const seed = raw.subarray(0, 32)
    const pkcs8Key = Buffer.from([
      ...new Uint8Array(ED25519_PKCS8_PREFIX),
      ...new Uint8Array(seed),
    ])
    return createPrivateKey({
      key: pkcs8Key,
      format: 'der',
      type: 'pkcs8',
    })
  }

  try {
    // Some environments store PKCS#8 DER as base64.
    return createPrivateKey({
      key: raw,
      format: 'der',
      type: 'pkcs8',
    })
  } catch {
    throw new Error('Unsupported CDP private key format')
  }
}

function buildJwt(apiKeyName: string, privateKey: KeyObject, method: string, path: string): string {
  const normalizedMethod = method.toUpperCase()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const now = Math.floor(Date.now() / 1000)
  const nonce = randomBytes(8).toString('hex')
  const algorithm = privateKey.asymmetricKeyType === 'ec' ? 'ES256' : 'EdDSA'

  const header = Buffer.from(
    JSON.stringify({ alg: algorithm, kid: apiKeyName, nonce })
  ).toString('base64url')

  const payload = Buffer.from(
    JSON.stringify({
      iss: 'cdp',
      sub: apiKeyName,
      nbf: now - 5,
      exp: now + 120,
      uris: [`${normalizedMethod} ${CDP_BASE}${normalizedPath}`],
    })
  ).toString('base64url')

  const signingInput = `${header}.${payload}`
  const signature =
    algorithm === 'ES256'
      ? (() => {
          const signer = createSign('SHA256')
          signer.update(signingInput)
          signer.end()
          return signer.sign(privateKey).toString('base64url')
        })()
      : signDetached(null, new TextEncoder().encode(signingInput), privateKey).toString('base64url')

  return `${signingInput}.${signature}`
}

async function cdpRequest<T>(
  method: string,
  path: string,
  body: unknown,
  apiKeyName: string,
  privateKey: KeyObject
): Promise<T> {
  const normalizedMethod = method.toUpperCase()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  const jwt = buildJwt(apiKeyName, privateKey, normalizedMethod, normalizedPath)
  const res = await fetch(`${CDP_BASE}${normalizedPath}`, {
    method: normalizedMethod,
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'Correlation-Context': 'sdk_version=sciflow/1.0,sdk_language=node',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`CDP API request failed (${res.status})`)
  }

  if (!text) {
    return {} as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('CDP API returned non-JSON response')
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-setup-secret')
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existingWalletRaw = process.env.AGENT_WALLET_DATA
  if (existingWalletRaw) {
    const existingWallet = parseExistingWalletData(existingWalletRaw)
    if (existingWallet) {
      return NextResponse.json({
        status: 'already_configured',
        message: 'Agent wallet already set.',
        wallet_id: existingWallet.wallet_id,
      })
    }
  }

  const apiKeyName = process.env.CDP_API_KEY_NAME
  const apiKeySecret = process.env.CDP_API_KEY_PRIVATE_KEY
  if (!apiKeyName || !apiKeySecret) {
    return NextResponse.json({ error: 'CDP keys not in Vercel env' }, { status: 500 })
  }

  try {
    const privateKey = parseCdpPrivateKey(apiKeySecret)

    const walletResponse = await cdpRequest<Record<string, unknown>>(
      'POST',
      '/v1/wallets',
      { wallet: { network_id: 'base-mainnet' } },
      apiKeyName,
      privateKey
    )

    const walletId = pickString(
      getPath(walletResponse, ['wallet', 'id']),
      getPath(walletResponse, ['wallet_id']),
      getPath(walletResponse, ['id'])
    )
    if (!walletId) throw new Error('Wallet ID missing from CDP response')

    const addressResponse = await cdpRequest<Record<string, unknown>>(
      'POST',
      `/v1/wallets/${walletId}/addresses`,
      {},
      apiKeyName,
      privateKey
    )

    const address = pickString(
      getPath(addressResponse, ['address_id']),
      getPath(addressResponse, ['address', 'address_id']),
      getPath(addressResponse, ['address', 'id'])
    )
    if (!address) throw new Error('Address missing from CDP response')

    const exportResponse = await cdpRequest<Record<string, unknown>>(
      'POST',
      `/v1/wallets/${walletId}:exportWallet`,
      {},
      apiKeyName,
      privateKey
    )

    const seed = pickString(getPath(exportResponse, ['seed']))
    if (!seed) throw new Error('Wallet seed missing from CDP response')

    const walletData = JSON.stringify({
      wallet_id: walletId,
      seed,
      network_id: 'base-mainnet',
    })

    return NextResponse.json({
      status: 'success',
      address,
      basescan: `https://basescan.org/address/${address}`,
      wallet_id: walletId,
      AGENT_WALLET_DATA: walletData,
      next_steps: [
        '1. Copy the AGENT_WALLET_DATA value',
        '2. Save AGENT_WALLET_DATA in your deployment environment',
        '3. Redeploy so the app picks up the new env var',
        `4. Fund the wallet with USDC on Base: send to ${address}`,
      ],
    })
  } catch (err) {
    console.error('[setup/agent-wallet] setup failed', err)

    const response: {
      error: string
      keys_present: { name: boolean; secret: boolean }
      details?: string
    } = {
      error: 'Failed to create agent wallet',
      keys_present: { name: !!apiKeyName, secret: !!apiKeySecret },
    }

    if (process.env.NODE_ENV !== 'production') {
      response.details = err instanceof Error ? err.message : String(err)
    }

    return NextResponse.json(response, { status: 500 })
  }
}
