"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Mail, AlertCircle, Loader2, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useWalletAuth } from '@/hooks/use-wallet-auth'

export default function LoginPage() {
  const router = useRouter()
  const { signInWithEmail, isAuthenticated } = useAuth()
  const {
    isLoading: walletLoading,
    step,
    stepLabel,
    error: walletError,
    connectBase,
    connectSolana,
    isAuthenticated: walletAuthed,
  } = useWalletAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmail, setShowEmail] = useState(false)

  // Redirect if already authenticated
  if (isAuthenticated || walletAuthed) {
    router.push('/dashboard')
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await signInWithEmail(email, password)
    
    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-serif text-foreground">
            Sign In
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Connect your wallet to get started
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Errors */}
          {(error || walletError) && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error || walletError}
            </div>
          )}

          {/* Auth progress */}
          {step !== 'idle' && (
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-accent animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{stepLabel}</p>
                {step === 'signing' && (
                  <p className="text-xs text-muted-foreground mt-0.5">Check your wallet for a signature request</p>
                )}
              </div>
            </div>
          )}

          {/* ── Wallet options by chain ── */}
          <div className="space-y-3">
            {/* Base - Coinbase Wallet */}
            <Button
              variant="outline"
              className="w-full h-16 justify-start gap-4 rounded-xl"
              onClick={() => connectBase(0)}
              disabled={walletLoading}
            >
              {walletLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">B</span>
                  </div>
                </div>
              )}
              <div className="text-left">
                <div className="font-medium text-foreground">Base</div>
                <div className="text-xs text-muted-foreground">Coinbase Wallet — recommended</div>
              </div>
            </Button>

            {/* Base - MetaMask */}
            <Button
              variant="outline"
              className="w-full h-16 justify-start gap-4 rounded-xl"
              onClick={() => connectBase(1)}
              disabled={walletLoading}
            >
              {walletLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                  <span className="text-xl">🦊</span>
                </div>
              )}
              <div className="text-left">
                <div className="font-medium text-foreground">Base</div>
                <div className="text-xs text-muted-foreground">MetaMask</div>
              </div>
            </Button>

            {/* Solana - Phantom */}
            <Button
              variant="outline"
              className="w-full h-16 justify-start gap-4 rounded-xl"
              onClick={connectSolana}
              disabled={walletLoading}
            >
              {walletLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                  <span className="text-lg text-purple-400 font-bold">◎</span>
                </div>
              )}
              <div className="text-left">
                <div className="font-medium text-foreground">Solana</div>
                <div className="text-xs text-muted-foreground">Phantom Wallet</div>
              </div>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <button 
                onClick={() => setShowEmail(!showEmail)}
                className="bg-card px-3 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                Sign in with email instead
                <ChevronDown className={`w-3 h-3 transition-transform ${showEmail ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Email form (collapsed) */}
          {showEmail && (
            <form onSubmit={handleEmailLogin} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-accent hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In with Email'
                )}
              </Button>
            </form>
          )}

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            By signing in, you agree to our{' '}
            <Link href="/docs" className="text-accent hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="/docs" className="text-accent hover:underline">Privacy Policy</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
