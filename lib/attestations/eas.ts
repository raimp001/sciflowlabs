/**
 * SciFlow Attestation Service
 *
 * Uses Ethereum Attestation Service (EAS) on Base for on-chain
 * credential verification. Labs can attest their credentials
 * (degrees, certifications, publications) and share them across
 * bounty proposals without re-uploading documents each time.
 *
 * EAS on Base: https://base.easscan.org
 *
 * Schema UIDs are registered on-chain and define the structure
 * of attestations. SciFlow uses custom schemas for:
 * - Lab Credentials (degrees, certifications)
 * - Research Track Record (publications, bounties completed)
 * - Verification Tier (platform-issued trust level)
 */

import { encodePacked, keccak256, type Address, type Hex } from 'viem'

// EAS Contract addresses on Base
export const EAS_CONTRACTS = {
  base: {
    eas: '0x4200000000000000000000000000000000000021' as Address,
    schemaRegistry: '0x4200000000000000000000000000000000000020' as Address,
  },
  baseSepolia: {
    eas: '0x4200000000000000000000000000000000000021' as Address,
    schemaRegistry: '0x4200000000000000000000000000000000000020' as Address,
  },
}

// SciFlow attestation schema UIDs (register these on Base via EAS)
// These should be set via environment variables after schema registration
export const SCHEMA_UIDS = {
  labCredential: process.env.NEXT_PUBLIC_EAS_SCHEMA_LAB_CREDENTIAL || '',
  researchRecord: process.env.NEXT_PUBLIC_EAS_SCHEMA_RESEARCH_RECORD || '',
  verificationTier: process.env.NEXT_PUBLIC_EAS_SCHEMA_VERIFICATION_TIER || '',
}

// Schema definitions for reference (used when registering on EAS)
export const SCHEMA_DEFINITIONS = {
  labCredential:
    'string credentialType, string institution, string degree, uint64 year, string documentHash, bool verified',
  researchRecord:
    'string publicationDoi, string title, string journal, uint64 year, uint32 citations',
  verificationTier:
    'address labAddress, string tier, uint64 verifiedAt, string platformSignature',
}

// EAS ABI for attestation operations
export const EAS_ABI = [
  {
    name: 'attest',
    type: 'function',
    inputs: [
      {
        name: 'request',
        type: 'tuple',
        components: [
          { name: 'schema', type: 'bytes32' },
          {
            name: 'data',
            type: 'tuple',
            components: [
              { name: 'recipient', type: 'address' },
              { name: 'expirationTime', type: 'uint64' },
              { name: 'revocable', type: 'bool' },
              { name: 'refUID', type: 'bytes32' },
              { name: 'data', type: 'bytes' },
              { name: 'value', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'getAttestation',
    type: 'function',
    inputs: [{ name: 'uid', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'uid', type: 'bytes32' },
          { name: 'schema', type: 'bytes32' },
          { name: 'time', type: 'uint64' },
          { name: 'expirationTime', type: 'uint64' },
          { name: 'revocationTime', type: 'uint64' },
          { name: 'refUID', type: 'bytes32' },
          { name: 'recipient', type: 'address' },
          { name: 'attester', type: 'address' },
          { name: 'revocable', type: 'bool' },
          { name: 'data', type: 'bytes' },
        ],
      },
    ],
  },
] as const

export const SCHEMA_REGISTRY_ABI = [
  {
    name: 'register',
    type: 'function',
    inputs: [
      { name: 'schema', type: 'string' },
      { name: 'resolver', type: 'address' },
      { name: 'revocable', type: 'bool' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
] as const

// ============================================================================
// Types
// ============================================================================

export interface LabCredentialAttestation {
  credentialType: 'degree' | 'certification' | 'license' | 'membership'
  institution: string
  degree: string
  year: number
  documentHash: string
  verified: boolean
}

export interface ResearchRecordAttestation {
  publicationDoi: string
  title: string
  journal: string
  year: number
  citations: number
}

export interface VerificationTierAttestation {
  labAddress: Address
  tier: string
  verifiedAt: number
  platformSignature: string
}

export interface AttestationResult {
  success: boolean
  uid?: string
  txHash?: string
  error?: string
}

export interface AttestationData {
  uid: string
  schema: string
  time: number
  expirationTime: number
  revocationTime: number
  recipient: Address
  attester: Address
  revocable: boolean
  data: Hex
}

// ============================================================================
// Encoding Helpers
// ============================================================================

export function encodeLabCredential(credential: LabCredentialAttestation): Hex {
  return encodePacked(
    ['string', 'string', 'string', 'uint64', 'string', 'bool'],
    [
      credential.credentialType,
      credential.institution,
      credential.degree,
      BigInt(credential.year),
      credential.documentHash,
      credential.verified,
    ]
  )
}

export function encodeResearchRecord(record: ResearchRecordAttestation): Hex {
  return encodePacked(
    ['string', 'string', 'string', 'uint64', 'uint32'],
    [
      record.publicationDoi,
      record.title,
      record.journal,
      BigInt(record.year),
      record.citations,
    ]
  )
}

export function encodeVerificationTier(tier: VerificationTierAttestation): Hex {
  return encodePacked(
    ['address', 'string', 'uint64', 'string'],
    [tier.labAddress, tier.tier, BigInt(tier.verifiedAt), tier.platformSignature]
  )
}

// ============================================================================
// Attestation URL builder (for linking to EAS scan)
// ============================================================================

export function getAttestationUrl(uid: string, network: 'base' | 'baseSepolia' = 'base'): string {
  const baseUrl = network === 'base'
    ? 'https://base.easscan.org'
    : 'https://base-sepolia.easscan.org'
  return `${baseUrl}/attestation/view/${uid}`
}

export function getSchemaUrl(schemaUid: string, network: 'base' | 'baseSepolia' = 'base'): string {
  const baseUrl = network === 'base'
    ? 'https://base.easscan.org'
    : 'https://base-sepolia.easscan.org'
  return `${baseUrl}/schema/view/${schemaUid}`
}
