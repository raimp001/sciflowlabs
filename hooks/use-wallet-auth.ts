"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { base } from 'wagmi/chains'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

type AuthStep = 'idle' | 'connecting' | 'signing' | 'authenticating'

/**
 * useWalletAuth - Unified hook for wallet sign-in
 * 
 * Supports:
 * - Base chain via Coinbase Wallet or MetaMask (wagmi)
 * - Solana via Phantom (window.solana)
 */
export function useWalletAuth() {
  const [step, setStep] = useState<AuthStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const authInProgress = useRef(false)

  // Wagmi hooks (for Base/EVM)
  const { address, isConnected, connector: activeConnector } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()

  // Auth context
  const { signInWithWallet, signOut, isAuthenticated } = useAuth()

  // After wagmi connects, run the sign+auth flow
  useEffect(() => {
    if (isConnected && address && step === 'connecting' && !authInProgress.current) {
      authInProgress.current = true
      authenticateEVM(address).finally(() => {
        authInProgress.current = false
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, step])

  // ── EVM/Base authentication ──
  const authenticateEVM = async (walletAddress: string) => {
    try {
      setStep('signing')
      setError(null)

      const nonceRes = await fetch(`/api/auth/wallet?address=${walletAddress}`)
      if (!nonceRes.ok) throw new Error('Failed to get authentication challenge')
      const { message } = await nonceRes.json()

      const signature = await signMessageAsync({ message })

      setStep('authenticating')

      const { error: authError } = await signInWithWallet('evm', walletAddress, signature)
      if (authError) throw authError

      setStep('idle')
      toast.success('Signed in successfully')
    } catch (err) {
      wagmiDisconnect()
      setError(err instanceof Error ? err.message : 'Authentication failed')
      setStep('idle')
    }
  }

  // ── Solana/Phantom authentication ──
  const connectSolana = useCallback(async () => {
    setError(null)
    setStep('connecting')

    try {
      const solana = (window as unknown as {
        solana?: {
          isPhantom?: boolean
          connect: () => Promise<{ publicKey: { toString: () => string } }>
          signMessage: (msg: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>
        }
      }).solana

      if (!solana?.isPhantom) {
        window.open('https://phantom.app/', '_blank')
        throw new Error('Phantom wallet not found. Please install it and try again.')
      }

      const resp = await solana.connect()
      const walletAddress = resp.publicKey.toString()

      setStep('signing')

      // Get nonce
      const nonceRes = await fetch(`/api/auth/wallet?address=${walletAddress}`)
      if (!nonceRes.ok) throw new Error('Failed to get authentication challenge')
      const { message } = await nonceRes.json()

      // Sign
      const encodedMessage = new TextEncoder().encode(message)
      const signedMessage = await solana.signMessage(encodedMessage, 'utf8')
      const signature = Buffer.from(signedMessage.signature).toString('base64')

      setStep('authenticating')

      const { error: authError } = await signInWithWallet('solana', walletAddress, signature)
      if (authError) throw authError

      setStep('idle')
      toast.success('Signed in successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Solana authentication failed')
      setStep('idle')
    }
  }, [signInWithWallet])

  // ── Connect EVM wallet (Base) ──
  const connectBase = useCallback((connectorIndex: number) => {
    setError(null)
    setStep('connecting')

    const connector = connectors[connectorIndex]
    if (!connector) {
      setError('Wallet not available')
      setStep('idle')
      return
    }

    connect(
      { connector, chainId: base.id },
      {
        onError: (err) => {
          setError(err.message || 'Failed to connect wallet')
          setStep('idle')
        },
      }
    )
  }, [connect, connectors])

  // ── Disconnect + sign out ──
  const disconnectAndSignOut = useCallback(async () => {
    wagmiDisconnect()
    await signOut()
    setStep('idle')
    setError(null)
    toast.success('Signed out')
  }, [wagmiDisconnect, signOut])

  const stepLabel = (() => {
    switch (step) {
      case 'connecting': return 'Connecting wallet...'
      case 'signing': return 'Sign the message in your wallet...'
      case 'authenticating': return 'Signing you in...'
      default: return null
    }
  })()

  return {
    // State
    address,
    isConnected,
    isAuthenticated,
    isLoading: step !== 'idle' || isConnecting,
    step,
    stepLabel,
    error,
    activeConnector,

    // Actions
    connectBase,       // connect via Coinbase Wallet or MetaMask (index 0 or 1)
    connectSolana,     // connect via Phantom
    disconnectAndSignOut,
  }
}
