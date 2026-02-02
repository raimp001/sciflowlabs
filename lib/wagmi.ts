"use client"

import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

/**
 * Wagmi configuration for SciFlow
 *
 * Uses Coinbase Smart Wallet as the primary connector.
 * Smart Wallet uses passkeys for one-tap authentication -
 * no seed phrases, no browser extensions required.
 */
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'SciFlow',
      appLogoUrl: 'https://sciflowlabs.com/icon.png',
      preference: 'smartWalletOnly', // Force Smart Wallet (passkey-based)
    }),
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
