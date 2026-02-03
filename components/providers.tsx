"use client"

import { type ReactNode, useEffect } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from 'sonner'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'viem/chains'
import { wagmiConfig } from '@/lib/wagmi'

const queryClient = new QueryClient()

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
          loginMethods: ['email', 'wallet', 'google', 'passkey'],
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
            <AuthProvider>
              <FrameInitializer />
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
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ThemeProvider>
  )
}

/**
 * Initializes the Farcaster Frame SDK when running in a frame context.
 * Calls sdk.actions.ready() to signal the frame is ready.
 */
function FrameInitializer() {
  useEffect(() => {
    const initFrame = async () => {
      try {
        // Dynamic import to avoid issues on server
        const { default: sdk } = await import('@farcaster/frame-sdk')
        const context = await sdk.context

        if (context) {
          // We're in a frame - signal ready
          console.log('Running in Farcaster frame context:', context)
          await sdk.actions.ready()
        }
      } catch {
        // Not in a frame context - this is fine
      }
    }

    initFrame()
  }, [])

  return null
}
