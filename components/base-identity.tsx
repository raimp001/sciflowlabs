"use client"

import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Wallet, CheckCircle2 } from 'lucide-react'

interface BaseIdentityProps {
  address?: string
  compact?: boolean
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function BaseIdentity({ address: propAddress, compact = false }: BaseIdentityProps) {
  const { walletAddress, isAuthenticated } = useAuth()
  const address = propAddress || walletAddress

  if (!address) return null

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
      {isAuthenticated && (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-xs">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      )}
    </div>
  )
}

export function ConnectedWalletCard() {
  const { walletAddress, isAuthenticated } = useAuth()

  if (!isAuthenticated || !walletAddress) {
    return (
      <div className="text-center py-4">
        <Wallet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No wallet connected</p>
        <p className="text-xs text-muted-foreground mt-1">
          Sign in to connect or create a wallet
        </p>
      </div>
    )
  }

  return <BaseIdentity address={walletAddress} />
}
