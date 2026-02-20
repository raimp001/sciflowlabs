"use client"

import { useState } from 'react'
import { useChainId, useSwitchChain, useEnsName } from 'wagmi'
import { base } from 'wagmi/chains'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Wallet, LogOut, Copy, ExternalLink, ChevronDown, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useWalletAuth } from '@/hooks/use-wallet-auth'

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

interface ConnectWalletButtonProps {
  variant?: 'default' | 'header' | 'sidebar'
}

export function ConnectWalletButton({ variant = 'default' }: ConnectWalletButtonProps) {
  const {
    address,
    isConnected,
    isAuthenticated,
    isLoading,
    step,
    stepLabel,
    error,
    activeConnector,
    connectBase,
    connectSolana,
    disconnectAndSignOut,
  } = useWalletAuth()

  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { data: ensName } = useEnsName({ address: address as `0x${string}` | undefined })
  const [copied, setCopied] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const isOnBase = chainId === base.id

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      toast.success('Address copied')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ──────────────────────────────────────────
  // SIGNED IN
  // ──────────────────────────────────────────
  if (isConnected && isAuthenticated && address) {
    if (variant === 'sidebar') {
      return (
        <div className="px-3 py-3 mt-2 mx-1 rounded-xl bg-emerald-900/30 border border-emerald-700/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 font-medium">
                {isOnBase ? 'Base' : 'Connected'}
              </span>
            </div>
            {!isOnBase && (
              <button
                onClick={() => switchChain({ chainId: base.id })}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                Switch
              </button>
            )}
          </div>
          <p className="text-xs font-mono text-slate-300 mt-1.5 truncate">
            {ensName || formatAddress(address)}
          </p>
          <button
            onClick={disconnectAndSignOut}
            className="text-xs text-red-400/70 hover:text-red-400 mt-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>
      )
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 rounded-full px-4 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-xs">{ensName || formatAddress(address)}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">Signed in via {activeConnector?.name || 'wallet'}</p>
            <p className="text-sm font-mono text-foreground mt-0.5">{formatAddress(address)}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isOnBase ? 'bg-blue-400' : 'bg-amber-400'}`} />
              <span className="text-xs text-muted-foreground">{isOnBase ? 'Base' : 'Other network'}</span>
            </div>
          </div>
          <DropdownMenuSeparator />
          {!isOnBase && (
            <DropdownMenuItem onClick={() => switchChain({ chainId: base.id })} className="cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">B</span>
              </div>
              Switch to Base
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
            {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy address'}
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on BaseScan
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnectAndSignOut} className="cursor-pointer text-red-400 focus:text-red-400">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // ──────────────────────────────────────────
  // LOADING
  // ──────────────────────────────────────────
  if (isLoading && step !== 'idle') {
    if (variant === 'sidebar') {
      return (
        <div className="px-3 py-3 mt-2 mx-1 rounded-xl border border-accent/20 bg-accent/5">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
            <span className="text-xs text-accent font-medium">{stepLabel}</span>
          </div>
          {step === 'signing' && (
            <p className="text-xs text-muted-foreground mt-1">Check your wallet</p>
          )}
        </div>
      )
    }

    return (
      <Button variant="outline" size="sm" className="gap-2 rounded-full px-5" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">{stepLabel}</span>
      </Button>
    )
  }

  // ──────────────────────────────────────────
  // NOT SIGNED IN
  // ──────────────────────────────────────────
  if (variant === 'sidebar') {
    return (
      <div className="mt-2 mx-1">
        {error && <p className="text-xs text-red-400 px-3 mb-2">{error}</p>}
        <button
          onClick={() => connectBase(0)}
          disabled={isLoading}
          className="w-full px-3 py-3 rounded-xl border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-accent" />
            <span className="text-xs text-foreground font-medium">Sign In</span>
          </div>
        </button>
      </div>
    )
  }

  // Header: show wallet picker
  if (showOptions) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-full text-xs px-3 gap-1.5" onClick={() => { connectBase(0); setShowOptions(false) }} disabled={isLoading}>
          <div className="w-3 h-3 rounded-full bg-blue-500" /> Base
        </Button>
        <Button variant="outline" size="sm" className="rounded-full text-xs px-3 gap-1.5" onClick={() => { connectSolana(); setShowOptions(false) }} disabled={isLoading}>
          <div className="w-3 h-3 rounded-full bg-purple-500" /> Solana
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowOptions(false)} className="text-xs text-muted-foreground">
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      className="gap-2 rounded-full px-5"
      onClick={() => setShowOptions(true)}
      disabled={isLoading}
    >
      <Wallet className="w-4 h-4" />
      Sign In
    </Button>
  )
}
