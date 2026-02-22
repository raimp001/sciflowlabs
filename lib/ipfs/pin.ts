/**
 * lib/ipfs/pin.ts  —  Pinata IPFS pinning helper (PR#3)
 *
 * Pins a file (Buffer | Blob | ReadableStream) or a JSON object to IPFS
 * via the Pinata REST API, then returns:
 *   { cid }   — the IPFS CIDv1 (used as Milestone.evidence_hash)
 *   { url }   — a public IPFS gateway URL
 *
 * Required env vars:
 *   PINATA_JWT          — Pinata v2 API JWT (preferred)
 *   PINATA_API_KEY      — legacy (fallback)
 *   PINATA_API_SECRET   — legacy (fallback)
 *
 * If none are set the function throws so callers can handle gracefully.
 */

export interface PinResult {
  cid: string
  url: string
  size: number
}

const PINATA_API = 'https://api.pinata.cloud'
const GATEWAY   = 'https://gateway.pinata.cloud/ipfs'

function getPinataHeaders(): Record<string, string> {
  const jwt = process.env.PINATA_JWT
  if (jwt) return { Authorization: `Bearer ${jwt}` }

  const key    = process.env.PINATA_API_KEY
  const secret = process.env.PINATA_API_SECRET
  if (key && secret) {
    return {
      pinata_api_key:        key,
      pinata_secret_api_key: secret,
    }
  }

  throw new Error(
    'Pinata credentials not configured. ' +
    'Set PINATA_JWT (preferred) or PINATA_API_KEY + PINATA_API_SECRET.'
  )
}

// ── Pin a file (Buffer / Blob / File) ─────────────────────────────────────────
export async function pinFile(
  file: Buffer | Blob | File,
  fileName: string,
  metadata?: Record<string, string>
): Promise<PinResult> {
  const headers = getPinataHeaders()

  const form = new FormData()

  const blob =
    file instanceof Buffer
      ? new Blob([file], { type: 'application/octet-stream' })
      : file

  form.append('file', blob, fileName)

  if (metadata) {
    form.append(
      'pinataMetadata',
      JSON.stringify({ name: fileName, keyvalues: metadata })
    )
  }

  form.append(
    'pinataOptions',
    JSON.stringify({ cidVersion: 1 }) // always CIDv1
  )

  const res = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
    method:  'POST',
    headers, // FormData sets its own Content-Type boundary
    body:    form,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Pinata pinFile failed (${res.status}): ${detail}`)
  }

  const json = await res.json() as { IpfsHash: string; PinSize: number }
  return {
    cid:  json.IpfsHash,
    url:  `${GATEWAY}/${json.IpfsHash}`,
    size: json.PinSize,
  }
}

// ── Pin a JSON object ─────────────────────────────────────────────────────────────
export async function pinJson(
  data: Record<string, unknown>,
  name: string,
  metadata?: Record<string, string>
): Promise<PinResult> {
  const headers = getPinataHeaders()

  const body = {
    pinataContent:  data,
    pinataMetadata: { name, keyvalues: metadata ?? {} },
    pinataOptions:  { cidVersion: 1 },
  }

  const res = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method:  'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Pinata pinJson failed (${res.status}): ${detail}`)
  }

  const json = await res.json() as { IpfsHash: string; PinSize: number }
  return {
    cid:  json.IpfsHash,
    url:  `${GATEWAY}/${json.IpfsHash}`,
    size: json.PinSize,
  }
}

// ── Convenience: build a gateway URL from a known CID ─────────────────────────
export function ipfsUrl(cid: string): string {
  return `${GATEWAY}/${cid}`
}
