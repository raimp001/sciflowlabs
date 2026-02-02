"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Wallet, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { SmartWalletAuth } from '@/components/smart-wallet-auth'

export default function LoginPage() {
  const router = useRouter()
  const { signInWithEmail, signInWithWallet } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletConnecting, setWalletConnecting] = useState<'solana' | 'evm' | null>(null)

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

  const handleWalletConnect = async (provider: 'solana' | 'evm') => {
    setWalletConnecting(provider)
    setError(null)

    try {
      let address: string
      let signature: string

      if (provider === 'solana') {
        const solana = (window as unknown as { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }>; signMessage: (msg: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }> } }).solana
        if (!solana?.isPhantom) {
          throw new Error('Please install Phantom wallet')
        }

        const resp = await solana.connect()
        address = resp.publicKey.toString()

        const message = `Sign this message to authenticate with SciFlow.\n\nTimestamp: ${Date.now()}`
        const encodedMessage = new TextEncoder().encode(message)
        const signedMessage = await solana.signMessage(encodedMessage, 'utf8')
        signature = Buffer.from(signedMessage.signature).toString('base64')
      } else {
        const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<string[]> } }).ethereum
        if (!ethereum) {
          throw new Error('Please install MetaMask')
        }

        const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
        address = accounts[0]

        const message = `Sign this message to authenticate with SciFlow.\n\nTimestamp: ${Date.now()}`
        signature = await ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        }) as unknown as string
      }

      const { error } = await signInWithWallet(provider, address, signature)
      
      if (error) {
        throw error
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setWalletConnecting(null)
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

        <CardContent className="pt-4">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Primary: One-tap Smart Wallet auth */}
          <SmartWalletAuth
            mode="login"
            onSuccess={() => router.push('/dashboard')}
            onError={(err) => setError(err)}
          />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">
                or continue with
              </span>
            </div>
          </div>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary">
              <TabsTrigger value="email" className="flex items-center gap-2 data-[state=active]:bg-card">
                <Mail className="w-4 h-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="wallet" className="flex items-center gap-2 data-[state=active]:bg-card">
                <Wallet className="w-4 h-4" />
                Wallet
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
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
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-3 border-border bg-secondary hover:bg-secondary/80"
                onClick={() => handleWalletConnect('solana')}
                disabled={walletConnecting !== null}
              >
                {walletConnecting === 'solana' ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-xl text-purple-400">◎</span>
                  </div>
                )}
                <div className="text-left">
                  <div className="font-medium text-foreground">Phantom (Solana)</div>
                  <div className="text-xs text-muted-foreground">Connect with Solana wallet</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-3 border-border bg-secondary hover:bg-secondary/80"
                onClick={() => handleWalletConnect('evm')}
                disabled={walletConnecting !== null}
              >
                {walletConnecting === 'evm' ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <span className="text-xl">🦊</span>
                  </div>
                )}
                <div className="text-left">
                  <div className="font-medium text-foreground">MetaMask (Base)</div>
                  <div className="text-xs text-muted-foreground">Connect with EVM wallet</div>
                </div>
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
              </p>
            </TabsContent>
          </Tabs>
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
