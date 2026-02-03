"use client"

import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

/**
 * Wagmi configuration for SciFlow
 *
 * Privy manages connectors (Smart Wallet, embedded wallets, etc).
 * We only define chains and transports here.
 */
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
  },
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
