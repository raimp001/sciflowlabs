"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertCircle, Loader2, Building, Microscope, CheckCircle2, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function SignupPage() {
  const router = useRouter()
  const { login, isAuthenticated, privyReady, signUpWithEmail } = useAuth()

  const [step, setStep] = useState(1)
  const [role, setRole] = useState<'funder' | 'lab'>('funder')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Redirect if already authenticated via Privy
  useEffect(() => {
    if (privyReady && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [privyReady, isAuthenticated, router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    const { error } = await signUpWithEmail(email, password, fullName, role)

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border bg-card text-center">
          <CardHeader className="pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-serif text-foreground">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              We&apos;ve sent a confirmation link to <strong className="text-foreground">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-6">
              Click the link in your email to verify your account and complete registration.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="w-full border-border text-foreground hover:bg-secondary rounded-full"
            >
              Return to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            Create Your Account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Join the decentralized science revolution
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-accent' : 'bg-secondary'}`} />
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-accent' : 'bg-secondary'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-accent' : 'bg-secondary'}`} />
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block text-foreground">I want to...</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(v) => setRole(v as 'funder' | 'lab')}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="funder"
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      role === 'funder'
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <RadioGroupItem value="funder" id="funder" className="sr-only" />
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      role === 'funder' ? 'bg-accent text-white' : 'bg-secondary text-muted-foreground'
                    }`}>
                      <Building className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">Fund Research</div>
                      <div className="text-xs text-muted-foreground">Post bounties & sponsor labs</div>
                    </div>
                  </Label>

                  <Label
                    htmlFor="lab"
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      role === 'lab'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-border hover:border-emerald-500/50'
                    }`}
                  >
                    <RadioGroupItem value="lab" id="lab" className="sr-only" />
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      role === 'lab' ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground'
                    }`}>
                      <Microscope className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">Conduct Research</div>
                      <div className="text-xs text-muted-foreground">Bid on bounties & earn</div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {/* Primary: Privy sign-up (wallet, email, social, passkey) */}
              <Button
                onClick={() => login()}
                className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-base font-medium"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Get Started
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Sign up with wallet, email, Google, or passkey
              </p>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="w-full border-border text-foreground hover:bg-secondary rounded-full"
              >
                Continue with Email & Password
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">
                  {role === 'funder' ? 'Full Name / Organization' : 'Lab / Researcher Name'}
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={role === 'funder' ? 'Acme Research Foundation' : 'Dr. Jane Smith'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-secondary border-border text-foreground"
                />
              </div>

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
                <Label htmlFor="password" className="text-foreground">Password</Label>
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
                <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="flex-1 border-border text-foreground hover:bg-secondary rounded-full"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
              </p>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-0">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Already have an account?
              </span>
            </div>
          </div>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full border-border text-foreground hover:bg-secondary rounded-full">
              Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
