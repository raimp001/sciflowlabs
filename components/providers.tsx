"use client"

import { type ReactNode, useEffect, useState, createContext, useContext } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from 'sonner'
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'viem/chains'
import { wagmiConfig } from '@/lib/wagmi'

const queryClient = new QueryClient()

// Frame context for mini app
interface FrameContextType {
  isInFrame: boolean
  frameUser: {
    fid?: number
    username?: string
    displayName?: string
    pfpUrl?: string
  } | null
  walletAddress: string | null
}

const FrameContext = createContext<FrameContextType>({
  isInFrame: false,
  frameUser: null,
  walletAddress: null,
})

export const useFrameContext = () => useContext(FrameContext)

// Determine default chain from environment
function getDefaultChain() {
  const network = process.env.NEXT_PUBLIC_BASE_NETWORK || 'base-sepolia'
  return network === 'base-mainnet' || network === 'base' ? base : baseSepolia
}

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''
  const defaultChain = getDefaultChain()

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <PrivyProvider
        appId={appId}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#c2632a',
            logo: 'https://sciflowlabs.com/icon.png',
            landingHeader: 'Sign in to SciFlow',
            loginMessage: 'Fund and conduct decentralized research',
          },
          loginMethods: ['wallet', 'email', 'google', 'passkey', 'farcaster'],
          defaultChain: defaultChain,
          supportedChains: [base, baseSepolia],
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
          externalWallets: {
            coinbaseWallet: {
              connectionOptions: 'smartWalletOnly',
            },
          },
          // Mini app / frame support
          fundingMethodConfig: {
            moonpay: { useSandbox: true },
          },
          // Farcaster frame support
          farcaster: {
            // Enable Farcaster login as auth method in frames
            enableClientAuth: true,
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <FrameAutoConnect>
              <AuthProvider>
                {children}
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    style: {
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid hsl(var(--border))',
                    },
                  }}
                />
              </AuthProvider>
            </FrameAutoConnect>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ThemeProvider>
  )
}

/**
 * Auto-connects wallet when running inside Base app / Warpcast frame.
 * Detects frame context and automatically signs in the user.
 */
function FrameAutoConnect({ children }: { children: ReactNode }) {
  const { login, authenticated, ready, connectWallet } = usePrivy()
  const { wallets } = useWallets()
  const [frameContext, setFrameContext] = useState<FrameContextType>({
    isInFrame: false,
    frameUser: null,
    walletAddress: null,
  })
  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false)

  useEffect(() => {
    const initFrame = async () => {
      try {
        // Dynamic import to avoid issues on server
        const { default: sdk } = await import('@farcaster/frame-sdk')
        const context = await sdk.context

        if (context) {
          console.log('Frame context detected:', context)

          // Extract user info from frame context
          const user = context.user
          setFrameContext({
            isInFrame: true,
            frameUser: user ? {
              fid: user.fid,
              username: user.username,
              displayName: user.displayName,
              pfpUrl: user.pfpUrl,
            } : null,
            walletAddress: null, // Will be set after wallet connect
          })

          // Signal frame is ready
          await sdk.actions.ready()

          // Auto-connect wallet if not already authenticated
          if (ready && !authenticated && !hasAttemptedAutoConnect) {
            setHasAttemptedAutoConnect(true)
            console.log('Auto-connecting wallet in frame context...')

            try {
              // Try to get the wallet provider from the frame
              const provider = await sdk.wallet.ethProvider
              if (provider) {
                // Request accounts from the frame's wallet
                const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[]
                if (accounts && accounts.length > 0) {
                  setFrameContext(prev => ({ ...prev, walletAddress: accounts[0] }))
                  console.log('Frame wallet address:', accounts[0])

                  // Connect with Privy using the frame wallet
                  await connectWallet()
                }
              }
            } catch (walletErr) {
              console.log('Frame wallet connect error, falling back to Privy login:', walletErr)
              // Fallback: trigger Privy login
              login()
            }
          }
        }
      } catch {
        // Not in a frame context - this is fine
        console.log('Not in frame context')
      }
    }

    initFrame()
  }, [ready, authenticated, hasAttemptedAutoConnect, login, connectWallet])

  // Update wallet address when wallets change
  useEffect(() => {
    if (wallets.length > 0 && frameContext.isInFrame) {
      setFrameContext(prev => ({ ...prev, walletAddress: wallets[0].address }))
    }
  }, [wallets, frameContext.isInFrame])

  return (
    <FrameContext.Provider value={frameContext}>
      {children}
    </FrameContext.Provider>
  )
}
