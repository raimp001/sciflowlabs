"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConnectors } from 'wagmi'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'

function connectorMeta(name: string) {
  const n = name.toLowerCase()
  if (n.includes('coinbase')) return {
    label: 'Coinbase Wallet',
    sublabel: 'Smart Wallet · no seed phrase needed',
    icon: (
      <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-xs text-white font-bold">C</span>
        </div>
      </div>
    ),
  }
  if (n.includes('metamask')) return {
    label: 'MetaMask',
    sublabel: 'Browser extension wallet',
    icon: (
      <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
        <span className="text-2xl">🦊</span>
      </div>
    ),
  }
  return {
    label: name,
    sublabel: 'Browser wallet',
    icon: (
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
        <span className="text-lg">💼</span>
      </div>
    ),
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, authStep, authError, connectWallet } = useAuth()
  const connectors = useConnectors()

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  const stepLabel = {
    connecting: 'Opening wallet…',
    signing: 'Check your wallet — approve the sign-in…',
    authenticating: 'Almost there…',
    idle: '',
  }[authStep]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in to SciFlow</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Connect your wallet to fund research or submit proposals
          </p>
        </div>

        {/* Error */}
        {authError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {authError}
          </div>
        )}

        {/* Loading step */}
        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" />
            <span className="text-foreground">{stepLabel}</span>
          </div>
        )}

        {/* Wallet options */}
        {!isLoading && (
          <div className="space-y-3">
            {connectors.map((connector, i) => {
              const meta = connectorMeta(connector.name)
              return (
                <button
                  key={connector.uid}
                  onClick={() => connectWallet(i)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-border hover:bg-secondary/30 transition-all text-left"
                >
                  {meta.icon}
                  <div>
                    <div className="font-medium text-sm text-foreground">{meta.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{meta.sublabel}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Guest access */}
        <div className="text-center pt-2">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40" />
            </div>
            <span className="relative bg-background px-3 text-xs text-muted-foreground">or</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 text-xs text-muted-foreground"
            onClick={() => router.push('/dashboard/open-bounties')}
          >
            Browse open bounties without signing in →
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Your wallet address identifies your account.
          No email or password needed.
        </p>
      </div>
    </div>
  )
}
