import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'SciFlow',
      appLogoUrl: 'https://sciflowlabs.com/icon.png',
      preference: 'all', // shows both Smart Wallet and Coinbase app
    }),
    metaMask(),
    injected({ shimDisconnect: true }), // any other browser wallet
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
  },
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
