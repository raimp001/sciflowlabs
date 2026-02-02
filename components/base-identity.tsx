"use client"

import { useAccount, useEnsName, useEnsAvatar } from 'wagmi'
import { base } from 'wagmi/chains'
import { Badge } from '@/components/ui/badge'
import { Wallet, CheckCircle2 } from 'lucide-react'

interface BaseIdentityProps {
  address?: `0x${string}`
  showAvatar?: boolean
  compact?: boolean
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function BaseIdentity({ address: propAddress, showAvatar = true, compact = false }: BaseIdentityProps) {
  const { address: connectedAddress, isConnected } = useAccount()
  const address = propAddress || connectedAddress

  if (!address) {
    return null
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Wallet className="w-3 h-3 text-blue-400" />
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {formatAddress(address)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
        {address.slice(2, 4).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm text-foreground truncate">
          {formatAddress(address)}
        </p>
        <p className="text-xs text-muted-foreground">Base Network</p>
      </div>
      {isConnected && address === connectedAddress && (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-xs">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      )}
    </div>
  )
}

export function ConnectedWalletCard() {
  const { address, isConnected } = useAccount()

  if (!isConnected || !address) {
    return (
      <div className="text-center py-4">
        <Wallet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No Base wallet connected</p>
      </div>
    )
  }

  return <BaseIdentity address={address} />
}
