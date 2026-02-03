"use client"

import { type ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from 'sonner'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'viem/chains'
import { wagmiConfig } from '@/lib/wagmi'

const queryClient = new QueryClient()

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''

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
          defaultChain: base,
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
        }}
      >
        <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
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
        </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ThemeProvider>
  )
}
