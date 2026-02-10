/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Blob } from 'node:buffer'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Set env before import
vi.stubEnv('PINATA_JWT', 'test-jwt-token')

const {
  uploadToIPFS,
  uploadJSONToIPFS,
  hashFile,
  uploadEvidenceBundle,
  verifyEvidence,
  fetchFromIPFS,
} = await import('@/lib/ipfs/client')

describe('IPFS Client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('hashFile', () => {
    it('produces a hex-encoded SHA-256 hash', async () => {
      const content = 'Hello, World!'
      const blob = new Blob([content]) as unknown as globalThis.Blob

      const hash = await hashFile(blob)
      expect(hash).toBeTruthy()
      expect(typeof hash).toBe('string')
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('produces deterministic hash', async () => {
      const blob1 = new Blob(['test data']) as unknown as globalThis.Blob
      const blob2 = new Blob(['test data']) as unknown as globalThis.Blob

      const hash1 = await hashFile(blob1)
      const hash2 = await hashFile(blob2)
      expect(hash1).toBe(hash2)
    })

    it('produces different hashes for different content', async () => {
      const blob1 = new Blob(['content A']) as unknown as globalThis.Blob
      const blob2 = new Blob(['content B']) as unknown as globalThis.Blob

      const hash1 = await hashFile(blob1)
      const hash2 = await hashFile(blob2)
      expect(hash1).not.toBe(hash2)
    })

    it('handles empty file', async () => {
      const blob = new Blob([]) as unknown as globalThis.Blob
      const hash = await hashFile(blob)
      expect(hash).toHaveLength(64)
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    })
  })

  describe('verifyEvidence', () => {
    it('returns valid=true when hash matches', async () => {
      const blob = new Blob(['test content']) as unknown as globalThis.Blob
      const expectedHash = await hashFile(blob)

      const result = await verifyEvidence(blob, expectedHash)
      expect(result.valid).toBe(true)
      expect(result.actualHash).toBe(expectedHash)
    })

    it('returns valid=false when hash does not match', async () => {
      const blob = new Blob(['test content']) as unknown as globalThis.Blob

      const result = await verifyEvidence(blob, 'wronghash')
      expect(result.valid).toBe(false)
      expect(result.actualHash).not.toBe('wronghash')
    })
  })

  describe('uploadToIPFS', () => {
    it('uploads file successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          IpfsHash: 'QmTestHash123',
          PinSize: 1024,
          Timestamp: '2024-01-01T00:00:00Z',
        }),
      })

      const blob = new Blob(['test']) as unknown as globalThis.Blob
      const result = await uploadToIPFS(blob, { name: 'test.txt' })

      expect(result.success).toBe(true)
      expect(result.cid).toBe('QmTestHash123')
      expect(result.hash).toBe('QmTestHash123')
      expect(result.size).toBe(1024)
      expect(result.url).toBe('https://gateway.pinata.cloud/ipfs/QmTestHash123')
    })

    it('handles upload failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      })

      const blob = new Blob(['test']) as unknown as globalThis.Blob
      const result = await uploadToIPFS(blob)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const blob = new Blob(['test']) as unknown as globalThis.Blob
      const result = await uploadToIPFS(blob)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('calls Pinata API with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ IpfsHash: 'Qm123', PinSize: 100, Timestamp: '' }),
      })

      const blob = new Blob(['test']) as unknown as globalThis.Blob
      await uploadToIPFS(blob)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.pinata.cloud/pinning/pinFileToIPFS')
    })
  })

  describe('uploadJSONToIPFS', () => {
    it('uploads JSON data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          IpfsHash: 'QmJsonHash456',
          PinSize: 512,
          Timestamp: '2024-01-01T00:00:00Z',
        }),
      })

      const result = await uploadJSONToIPFS({ key: 'value' }, { name: 'test.json' })

      expect(result.success).toBe(true)
      expect(result.cid).toBe('QmJsonHash456')
      expect(result.url).toBe('https://gateway.pinata.cloud/ipfs/QmJsonHash456')
    })

    it('handles JSON upload failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Rate limited' } }),
      })

      const result = await uploadJSONToIPFS({ data: 'test' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Rate limited')
    })

    it('calls Pinata JSON API with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ IpfsHash: 'Qm', PinSize: 0, Timestamp: '' }),
      })

      await uploadJSONToIPFS({ test: true })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.pinata.cloud/pinning/pinJSONToIPFS')
    })
  })

  describe('fetchFromIPFS', () => {
    it('fetches from primary gateway', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const response = await fetchFromIPFS('QmTestCid')
      expect(response.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gateway.pinata.cloud/ipfs/QmTestCid',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    })

    it('falls back to secondary gateway on failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ ok: true })

      const response = await fetchFromIPFS('QmTestCid')
      expect(response.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://ipfs.io/ipfs/QmTestCid',
        expect.any(Object)
      )
    })

    it('falls back to third gateway if first two fail', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: true })

      const response = await fetchFromIPFS('QmTestCid')
      expect(response.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('throws error when all gateways fail', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'))

      await expect(fetchFromIPFS('QmTestCid')).rejects.toThrow('Failed to fetch from IPFS')
    })
  })
})
