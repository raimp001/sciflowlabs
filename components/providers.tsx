"use client"

import { type ReactNode, useState } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi-config'
import { AuthProvider } from '@/contexts/auth-context'

const toasterStyle = {
  background: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
  border: '1px solid hsl(var(--border))',
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
    },
  }))

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster position="bottom-right" toastOptions={{ style: toasterStyle }} />
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
