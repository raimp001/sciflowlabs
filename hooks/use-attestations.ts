"use client"

import { useState, useCallback, useMemo } from 'react'
import { useAccount, useWriteContract, useChainId } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import {
  EAS_CONTRACTS,
  EAS_ABI,
  SCHEMA_UIDS,
  encodeLabCredential,
  encodeResearchRecord,
  getAttestationUrl,
  type LabCredentialAttestation,
  type ResearchRecordAttestation,
  type AttestationResult,
} from '@/lib/attestations/eas'

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

/**
 * Get the current network config
 */
function getNetworkConfig() {
  const envNetwork = process.env.NEXT_PUBLIC_BASE_NETWORK || 'base-sepolia'
  const isTestnet = envNetwork === 'base-sepolia' || envNetwork === 'sepolia'
  return {
    network: isTestnet ? 'baseSepolia' : 'base' as const,
    chainId: isTestnet ? baseSepolia.id : base.id,
    isTestnet,
  }
}

/**
 * Hook for creating and reading EAS attestations on Base/Base Sepolia.
 *
 * Automatically uses the correct network based on NEXT_PUBLIC_BASE_NETWORK env var.
 * Defaults to Base Sepolia for testing.
 *
 * Usage:
 *   const { attestCredential, attestResearch, getAttestation, isAttesting, network } = useAttestations()
 *   await attestCredential({ credentialType: 'degree', institution: 'MIT', ... })
 */
export function useAttestations() {
  const { address, isConnected } = useAccount()
  const connectedChainId = useChainId()
  const [isAttesting, setIsAttesting] = useState(false)
  const [lastResult, setLastResult] = useState<AttestationResult | null>(null)

  const { writeContractAsync } = useWriteContract()

  // Determine which network to use
  const networkConfig = useMemo(() => getNetworkConfig(), [])
  const network = networkConfig.network
  const targetChainId = networkConfig.chainId

  // Get the EAS contract for the current network
  const easContract = EAS_CONTRACTS[network].eas

  // Check if user is on the correct chain
  const isCorrectChain = connectedChainId === targetChainId

  /**
   * Create a lab credential attestation on-chain
   */
  const attestCredential = useCallback(async (
    credential: LabCredentialAttestation,
    recipient?: `0x${string}`
  ): Promise<AttestationResult> => {
    if (!isConnected || !address) {
      return { success: false, error: 'Wallet not connected' }
    }

    if (!isCorrectChain) {
      return {
        success: false,
        error: `Please switch to ${network === 'baseSepolia' ? 'Base Sepolia' : 'Base'} network`,
      }
    }

    if (!SCHEMA_UIDS.labCredential) {
      return { success: false, error: 'Lab credential schema not configured. Set NEXT_PUBLIC_EAS_SCHEMA_LAB_CREDENTIAL.' }
    }

    setIsAttesting(true)
    try {
      const encodedData = encodeLabCredential(credential)

      const txHash = await writeContractAsync({
        address: easContract,
        abi: EAS_ABI,
        functionName: 'attest',
        args: [{
          schema: SCHEMA_UIDS.labCredential as `0x${string}`,
          data: {
            recipient: recipient || address,
            expirationTime: 0n, // No expiration
            revocable: true,
            refUID: ZERO_BYTES32,
            data: encodedData,
            value: 0n,
          },
        }],
        chainId: targetChainId,
      })

      const result: AttestationResult = {
        success: true,
        txHash: txHash,
      }

      setLastResult(result)
      return result
    } catch (err) {
      const result: AttestationResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create attestation',
      }
      setLastResult(result)
      return result
    } finally {
      setIsAttesting(false)
    }
  }, [isConnected, address, isCorrectChain, network, easContract, targetChainId, writeContractAsync])

  /**
   * Create a research record attestation on-chain
   */
  const attestResearch = useCallback(async (
    record: ResearchRecordAttestation,
    recipient?: `0x${string}`
  ): Promise<AttestationResult> => {
    if (!isConnected || !address) {
      return { success: false, error: 'Wallet not connected' }
    }

    if (!isCorrectChain) {
      return {
        success: false,
        error: `Please switch to ${network === 'baseSepolia' ? 'Base Sepolia' : 'Base'} network`,
      }
    }

    if (!SCHEMA_UIDS.researchRecord) {
      return { success: false, error: 'Research record schema not configured. Set NEXT_PUBLIC_EAS_SCHEMA_RESEARCH_RECORD.' }
    }

    setIsAttesting(true)
    try {
      const encodedData = encodeResearchRecord(record)

      const txHash = await writeContractAsync({
        address: easContract,
        abi: EAS_ABI,
        functionName: 'attest',
        args: [{
          schema: SCHEMA_UIDS.researchRecord as `0x${string}`,
          data: {
            recipient: recipient || address,
            expirationTime: 0n,
            revocable: false, // Research records are permanent
            refUID: ZERO_BYTES32,
            data: encodedData,
            value: 0n,
          },
        }],
        chainId: targetChainId,
      })

      const result: AttestationResult = {
        success: true,
        txHash: txHash,
      }

      setLastResult(result)
      return result
    } catch (err) {
      const result: AttestationResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create attestation',
      }
      setLastResult(result)
      return result
    } finally {
      setIsAttesting(false)
    }
  }, [isConnected, address, isCorrectChain, network, easContract, targetChainId, writeContractAsync])

  /**
   * Read an attestation by UID
   */
  const getAttestation = useCallback(async (uid: `0x${string}`) => {
    return {
      uid,
      url: getAttestationUrl(uid, network),
    }
  }, [network])

  return {
    attestCredential,
    attestResearch,
    getAttestation,
    isAttesting,
    lastResult,
    isConnected,
    isCorrectChain,
    walletAddress: address,
    network,
    chainId: targetChainId,
    isTestnet: networkConfig.isTestnet,
  }
}
