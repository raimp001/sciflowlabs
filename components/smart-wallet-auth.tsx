"use client"

import { useCallback, useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { coinbaseWallet } from 'wagmi/connectors'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { Loader2, Fingerprint, Wallet, CheckCircle2 } from 'lucide-react'

interface SmartWalletAuthProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  mode?: 'login' | 'signup'
  role?: 'funder' | 'lab'
  className?: string
}

/**
 * Coinbase Smart Wallet one-tap authentication.
 *
 * Uses passkeys (biometric / device PIN) for wallet creation
 * and signing. No seed phrases, no extensions. One tap to create
 * an account or sign in.
 */
export function SmartWalletAuth({
  onSuccess,
  onError,
  mode = 'login',
  role = 'funder',
  className,
}: SmartWalletAuthProps) {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, isPending: isConnectPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { signInWithWallet } = useAuth()

  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authStep, setAuthStep] = useState<'idle' | 'connecting' | 'signing' | 'verifying' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Once wallet is connected, automatically sign the auth message
  const handleAuthenticate = useCallback(async () => {
    if (!address || isAuthenticating) return

    setIsAuthenticating(true)
    setError(null)

    try {
      // Step 1: Sign authentication message
      setAuthStep('signing')
      const timestamp = Date.now()
      const message = `Sign this message to authenticate with SciFlow.\n\nAddress: ${address}\nTimestamp: ${timestamp}`

      const signature = await signMessageAsync({ message })

      // Step 2: Verify on server and create session
      setAuthStep('verifying')
      const result = await signInWithWallet('evm', address, signature)

      if (result.error) {
        throw result.error
      }

      setAuthStep('done')
      onSuccess?.()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMsg)
      setAuthStep('idle')
      onError?.(errorMsg)
    } finally {
      setIsAuthenticating(false)
    }
  }, [address, isAuthenticating, signMessageAsync, signInWithWallet, onSuccess, onError])

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (isConnected && address && authStep === 'connecting') {
      handleAuthenticate()
    }
  }, [isConnected, address, authStep, handleAuthenticate])

  const handleConnect = () => {
    setError(null)
    setAuthStep('connecting')

    connect({
      connector: coinbaseWallet({
        appName: 'SciFlow',
        appLogoUrl: 'https://sciflowlabs.com/icon.png',
        preference: 'smartWalletOnly',
      }),
    })
  }

  const isLoading = isConnecting || isConnectPending || isAuthenticating

  if (authStep === 'done') {
    return (
      <div className={`flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-500 ${className || ''}`}>
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-sm font-medium">Signed in with Smart Wallet</span>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <Button
        type="button"
        onClick={isConnected ? handleAuthenticate : handleConnect}
        disabled={isLoading}
        className="w-full h-12 rounded-xl bg-[#0052FF] hover:bg-[#0047e0] text-white font-medium text-base gap-2.5 shadow-sm hover:shadow-md transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {authStep === 'connecting' && 'Creating wallet...'}
            {authStep === 'signing' && 'Approve in wallet...'}
            {authStep === 'verifying' && 'Verifying...'}
            {authStep === 'idle' && 'Connecting...'}
          </>
        ) : (
          <>
            <Fingerprint className="w-5 h-5" />
            {mode === 'signup'
              ? 'Create account with passkey'
              : 'Sign in with passkey'}
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <p className="text-xs text-center text-muted-foreground">
        <Wallet className="w-3 h-3 inline mr-1" />
        Powered by Coinbase Smart Wallet. No extension needed.
      </p>
    </div>
  )
}
