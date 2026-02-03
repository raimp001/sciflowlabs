"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Mail, Wallet, AlertCircle, Loader2, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, privyReady, signInWithEmail } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (privyReady && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [privyReady, isAuthenticated, router])

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
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12">
              <path
                d="M9 3V11L5 19C4.5 20 5 21 6 21H18C19 21 19.5 20 19 19L15 11V3"
                stroke="hsl(20, 70%, 55%)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9 3H15" stroke="hsl(20, 70%, 55%)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="11" cy="15" r="1.2" fill="hsl(20, 70%, 55%)" />
              <circle cx="14" cy="16" r="0.9" fill="hsl(20, 70%, 65%)" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-serif text-foreground">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to manage your research bounties
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Primary: Privy login (wallet, email, social, passkey) */}
          <Button
            onClick={() => login()}
            className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-base font-medium"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Connect with wallet, email, Google, or passkey
          </p>

          {/* Secondary: Direct email/password for existing Supabase users */}
          {!showEmailForm ? (
            <div className="pt-2">
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-2 transition-colors"
              >
                Sign in with email & password instead
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">email & password</span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
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
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-accent hover:underline"
                    >
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
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-secondary rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Sign In with Email
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-0">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                New to SciFlow?
              </span>
            </div>
          </div>
          <Link href="/signup" className="w-full">
            <Button variant="outline" className="w-full border-border text-foreground hover:bg-secondary rounded-full">
              Create an Account
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
