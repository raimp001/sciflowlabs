"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, authStep, authError, connectWallet } = useAuth()

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  const stepLabel = {
    connecting: 'Opening Coinbase Wallet…',
    signing: 'Approve sign-in in your wallet…',
    authenticating: 'Signing you in…',
    idle: '',
  }[authStep]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">SciFlow</h1>
          <p className="text-sm text-muted-foreground">
            Fund breakthrough research. Pay only on proof.
          </p>
        </div>

        {/* Error */}
        {authError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {authError}
          </div>
        )}

        {/* In-progress */}
        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" />
            <span className="text-foreground">{stepLabel}</span>
          </div>
        )}

        {/* Single sign-in button */}
        {!isLoading && (
          <Button
            className="w-full h-14 gap-3 rounded-xl text-base"
            onClick={() => connectWallet(0)}
          >
            {/* Coinbase "C" mark */}
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
              C
            </span>
            Continue with Coinbase
          </Button>
        )}

        {/* Guest link */}
        <div className="text-center">
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => router.push('/dashboard/open-bounties')}
          >
            Browse open bounties without signing in →
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Uses Coinbase Smart Wallet on Base.
          No seed phrase required.
        </p>
      </div>
    </div>
  )
}
