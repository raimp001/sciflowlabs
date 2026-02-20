/**
 * Creates an agent wallet using Coinbase CDP REST API directly.
 * Avoids ESM/CJS conflicts with the AgentKit package.
 *
 * Run: node scripts/create-agent-wallet.mjs
 */

import { createHash, createSign } from 'node:crypto'
import { readFileSync } from 'node:fs'

// ── Load env ──────────────────────────────────────────────────────────────
const envLines = readFileSync(new URL('../.env.vercel.local', import.meta.url), 'utf8').split('\n')
const env = {}
for (const line of envLines) {
  const eq = line.indexOf('=')
  if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^"|"$/g, '')
}

const API_KEY_NAME = env.CDP_API_KEY_NAME
const API_KEY_SECRET = env.CDP_API_KEY_PRIVATE_KEY

if (!API_KEY_NAME || !API_KEY_SECRET) {
  console.error('Missing CDP_API_KEY_NAME or CDP_API_KEY_PRIVATE_KEY')
  process.exit(1)
}

const BASE_URL = 'https://api.cdp.coinbase.com/platform'

// ── JWT auth for CDP API ───────────────────────────────────────────────────
function buildJwt(method, path) {
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: API_KEY_NAME, nonce: Math.random().toString(36).slice(2) })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(JSON.stringify({
    sub: API_KEY_NAME,
    iss: 'cdp',
    nbf: now,
    exp: now + 120,
    uris: [`${method} ${BASE_URL}${path}`],
  })).toString('base64url')

  const data = `${header}.${payload}`

  // The key comes as base64-encoded DER for ES256
  let keyPem
  try {
    const raw = Buffer.from(API_KEY_SECRET, 'base64')
    // Wrap as PEM if not already
    keyPem = `-----BEGIN EC PRIVATE KEY-----\n${raw.toString('base64').match(/.{1,64}/g).join('\n')}\n-----END EC PRIVATE KEY-----`
  } catch {
    keyPem = API_KEY_SECRET
  }

  const sign = createSign('SHA256')
  sign.update(data)
  sign.end()
  const sig = sign.sign({ key: keyPem, format: 'pem', type: 'pkcs8' }, 'base64url').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${data}.${sig}`
}

async function cdpFetch(method, path, body) {
  const token = buildJwt(method, path)
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`CDP API ${res.status}: ${text}`)
  return JSON.parse(text)
}

// ── Main ───────────────────────────────────────────────────────────────────
try {
  console.log('Creating agent wallet on Base mainnet...\n')

  // 1. Create wallet
  const wallet = await cdpFetch('POST', '/v1/wallets', {
    wallet: { network_id: 'base-mainnet' },
  })

  const walletId = wallet.wallet?.id
  if (!walletId) throw new Error('No wallet ID in response: ' + JSON.stringify(wallet))

  // 2. Create address in wallet
  const addrRes = await cdpFetch('POST', `/v1/wallets/${walletId}/addresses`, {})
  const address = addrRes.address_id

  // 3. Export wallet seed
  const exportRes = await cdpFetch('POST', `/v1/wallets/${walletId}:exportWallet`, {})
  const seed = exportRes.seed

  const walletData = JSON.stringify({ wallet_id: walletId, seed })

  console.log('✅ Agent wallet ready!')
  console.log('━'.repeat(60))
  console.log('📍 Address:', address)
  console.log('🔗 BaseScan: https://basescan.org/address/' + address)
  console.log('')
  console.log('━'.repeat(60))
  console.log('Run this to add AGENT_WALLET_DATA to Vercel:\n')
  console.log(`printf '${walletData.replace(/'/g, "'\\''")}' | vercel env add AGENT_WALLET_DATA production --force`)
  console.log('')
  console.log('Then redeploy: vercel --prod --yes')
  console.log('━'.repeat(60))
  console.log('')
  console.log('💡 Fund this address with USDC on Base to enable payments.')

} catch (err) {
  console.error('❌ Error:', err.message)
  console.error('')
  console.error('If you see "401 Unauthorized", your CDP key may not have wallet permissions.')
  console.error('Go to https://portal.cdp.coinbase.com → API Keys → check permissions.')
}
