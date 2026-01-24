"use client"

import { type ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'

interface ProvidersProps {
  children: ReactNode
}

// Only import AuthProvider if Supabase is configured
const hasSupabase = typeof window !== 'undefined' 
  ? !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : true

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem 
      disableTransitionOnChange
    >
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
    </ThemeProvider>
  )
}
