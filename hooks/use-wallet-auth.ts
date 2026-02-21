"use client"

// Re-export auth from the central context so older components still work
export { useAuth as useWalletAuth } from '@/contexts/auth-context'
