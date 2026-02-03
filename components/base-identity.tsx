"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wallet, CheckCircle2, Copy, Check, ExternalLink } from 'lucide-react'

interface BaseIdentityProps {
  address?: string
  compact?: boolean
  showFull?: boolean
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function BaseIdentity({ address: propAddress, compact = false, showFull = false }: BaseIdentityProps) {
  const { walletAddress, isAuthenticated } = useAuth()
  const [copied, setCopied] = useState(false)
  const address = propAddress || walletAddress

  if (!address) return null

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const explorerUrl = `https://basescan.org/address/${address}`

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
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
          {address.slice(2, 4).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm text-foreground truncate">
            {showFull ? address : formatAddress(address)}
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

      {/* Full address with copy */}
      <div className="p-3 bg-secondary/50 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground mb-2">Your Wallet Address</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono text-foreground bg-background p-2 rounded overflow-x-auto">
            {address}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAddress}
            className="h-8 w-8 p-0 shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 w-8 p-0 shrink-0 flex items-center justify-center rounded hover:bg-secondary"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>
      </div>
    </div>
  )
}

export function ConnectedWalletCard() {
  const { walletAddress, isAuthenticated, login } = useAuth()

  if (!isAuthenticated || !walletAddress) {
    return (
      <div className="text-center py-4">
        <Wallet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No wallet connected</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Sign in to connect or create a wallet
        </p>
        <Button
          onClick={() => login()}
          variant="outline"
          className="border-border text-foreground hover:bg-secondary rounded-full"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      </div>
    )
  }

  return <BaseIdentity address={walletAddress} />
}
