import { describe, it, expect } from 'vitest'
import {
  EAS_CONTRACTS,
  SCHEMA_DEFINITIONS,
  EAS_ABI,
  SCHEMA_REGISTRY_ABI,
  encodeLabCredential,
  encodeResearchRecord,
  encodeVerificationTier,
  getAttestationUrl,
  getSchemaUrl,
  type LabCredentialAttestation,
  type ResearchRecordAttestation,
  type VerificationTierAttestation,
} from '@/lib/attestations/eas'

describe('EAS Attestation Service', () => {
  describe('Contract Addresses', () => {
    it('has valid Base contract addresses', () => {
      expect(EAS_CONTRACTS.base.eas).toBe('0x4200000000000000000000000000000000000021')
      expect(EAS_CONTRACTS.base.schemaRegistry).toBe('0x4200000000000000000000000000000000000020')
    })

    it('has valid Base Sepolia contract addresses', () => {
      expect(EAS_CONTRACTS.baseSepolia.eas).toBe('0x4200000000000000000000000000000000000021')
      expect(EAS_CONTRACTS.baseSepolia.schemaRegistry).toBe('0x4200000000000000000000000000000000000020')
    })
  })

  describe('Schema Definitions', () => {
    it('has labCredential schema', () => {
      expect(SCHEMA_DEFINITIONS.labCredential).toContain('credentialType')
      expect(SCHEMA_DEFINITIONS.labCredential).toContain('institution')
      expect(SCHEMA_DEFINITIONS.labCredential).toContain('degree')
      expect(SCHEMA_DEFINITIONS.labCredential).toContain('year')
      expect(SCHEMA_DEFINITIONS.labCredential).toContain('documentHash')
      expect(SCHEMA_DEFINITIONS.labCredential).toContain('verified')
    })

    it('has researchRecord schema', () => {
      expect(SCHEMA_DEFINITIONS.researchRecord).toContain('publicationDoi')
      expect(SCHEMA_DEFINITIONS.researchRecord).toContain('title')
      expect(SCHEMA_DEFINITIONS.researchRecord).toContain('journal')
      expect(SCHEMA_DEFINITIONS.researchRecord).toContain('citations')
    })

    it('has verificationTier schema', () => {
      expect(SCHEMA_DEFINITIONS.verificationTier).toContain('labAddress')
      expect(SCHEMA_DEFINITIONS.verificationTier).toContain('tier')
      expect(SCHEMA_DEFINITIONS.verificationTier).toContain('verifiedAt')
      expect(SCHEMA_DEFINITIONS.verificationTier).toContain('platformSignature')
    })
  })

  describe('ABI Definitions', () => {
    it('EAS ABI has attest function', () => {
      const attestFn = EAS_ABI.find(fn => fn.name === 'attest')
      expect(attestFn).toBeDefined()
      expect(attestFn?.type).toBe('function')
    })

    it('EAS ABI has getAttestation function', () => {
      const getFn = EAS_ABI.find(fn => fn.name === 'getAttestation')
      expect(getFn).toBeDefined()
      expect(getFn?.type).toBe('function')
    })

    it('Schema Registry ABI has register function', () => {
      const registerFn = SCHEMA_REGISTRY_ABI.find(fn => fn.name === 'register')
      expect(registerFn).toBeDefined()
    })
  })

  describe('encodeLabCredential', () => {
    it('encodes a lab credential to hex', () => {
      const credential: LabCredentialAttestation = {
        credentialType: 'degree',
        institution: 'MIT',
        degree: 'PhD Biochemistry',
        year: 2020,
        documentHash: 'abc123',
        verified: true,
      }

      const encoded = encodeLabCredential(credential)
      expect(encoded).toBeTruthy()
      expect(typeof encoded).toBe('string')
      expect(encoded.startsWith('0x')).toBe(true)
    })

    it('produces different encodings for different credentials', () => {
      const cred1: LabCredentialAttestation = {
        credentialType: 'degree',
        institution: 'MIT',
        degree: 'PhD',
        year: 2020,
        documentHash: 'hash1',
        verified: true,
      }

      const cred2: LabCredentialAttestation = {
        credentialType: 'certification',
        institution: 'Stanford',
        degree: 'MS',
        year: 2021,
        documentHash: 'hash2',
        verified: false,
      }

      expect(encodeLabCredential(cred1)).not.toBe(encodeLabCredential(cred2))
    })

    it('produces deterministic encoding', () => {
      const credential: LabCredentialAttestation = {
        credentialType: 'degree',
        institution: 'Harvard',
        degree: 'PhD',
        year: 2019,
        documentHash: 'xyz',
        verified: true,
      }

      const first = encodeLabCredential(credential)
      const second = encodeLabCredential(credential)
      expect(first).toBe(second)
    })
  })

  describe('encodeResearchRecord', () => {
    it('encodes a research record to hex', () => {
      const record: ResearchRecordAttestation = {
        publicationDoi: '10.1234/test.2024',
        title: 'A Novel Approach',
        journal: 'Nature',
        year: 2024,
        citations: 42,
      }

      const encoded = encodeResearchRecord(record)
      expect(encoded).toBeTruthy()
      expect(encoded.startsWith('0x')).toBe(true)
    })

    it('produces deterministic encoding', () => {
      const record: ResearchRecordAttestation = {
        publicationDoi: '10.1234/test',
        title: 'Test',
        journal: 'Science',
        year: 2023,
        citations: 10,
      }

      expect(encodeResearchRecord(record)).toBe(encodeResearchRecord(record))
    })
  })

  describe('encodeVerificationTier', () => {
    it('encodes a verification tier to hex', () => {
      const tier: VerificationTierAttestation = {
        labAddress: '0x1234567890123456789012345678901234567890',
        tier: 'verified',
        verifiedAt: Math.floor(Date.now() / 1000),
        platformSignature: 'sig123',
      }

      const encoded = encodeVerificationTier(tier)
      expect(encoded).toBeTruthy()
      expect(encoded.startsWith('0x')).toBe(true)
    })

    it('produces different encodings for different tiers', () => {
      const base = {
        labAddress: '0x1234567890123456789012345678901234567890' as const,
        verifiedAt: 1000000,
        platformSignature: 'sig',
      }

      const t1 = encodeVerificationTier({ ...base, tier: 'basic' })
      const t2 = encodeVerificationTier({ ...base, tier: 'trusted' })
      expect(t1).not.toBe(t2)
    })
  })

  describe('URL Builders', () => {
    describe('getAttestationUrl', () => {
      it('generates Base mainnet URL', () => {
        const url = getAttestationUrl('0xabc123', 'base')
        expect(url).toBe('https://base.easscan.org/attestation/view/0xabc123')
      })

      it('generates Base Sepolia URL', () => {
        const url = getAttestationUrl('0xdef456', 'baseSepolia')
        expect(url).toBe('https://base-sepolia.easscan.org/attestation/view/0xdef456')
      })

      it('defaults to Base mainnet', () => {
        const url = getAttestationUrl('0xabc')
        expect(url).toContain('base.easscan.org')
        expect(url).not.toContain('sepolia')
      })
    })

    describe('getSchemaUrl', () => {
      it('generates Base mainnet schema URL', () => {
        const url = getSchemaUrl('0xschema123', 'base')
        expect(url).toBe('https://base.easscan.org/schema/view/0xschema123')
      })

      it('generates Base Sepolia schema URL', () => {
        const url = getSchemaUrl('0xschema456', 'baseSepolia')
        expect(url).toBe('https://base-sepolia.easscan.org/schema/view/0xschema456')
      })

      it('defaults to Base mainnet', () => {
        const url = getSchemaUrl('0xschema')
        expect(url).toContain('base.easscan.org')
        expect(url).not.toContain('sepolia')
      })
    })
  })
})
