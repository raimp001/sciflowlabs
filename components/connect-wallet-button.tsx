"use client"

import { useState } from 'react'
import { useConnectors, useEnsName } from 'wagmi'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LogOut, Copy, ExternalLink, ChevronDown,
  Check, Loader2, Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'

function fmt(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function ConnectWalletButton({ variant = 'header' }: { variant?: 'header' | 'sidebar' }) {
  const { isAuthenticated, isLoading, authStep, walletAddress, dbUser, connectWallet, disconnectWallet } = useAuth()
  const connectors = useConnectors()
  const { data: ensName } = useEnsName({ address: walletAddress as `0x${string}` | undefined })
  const [copied, setCopied] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const displayName = dbUser?.full_name
    ?? ensName
    ?? (walletAddress ? fmt(walletAddress) : 'Account')

  const stepLabel = {
    connecting: 'Opening wallet…',
    signing: 'Approve in wallet…',
    authenticating: 'Signing in…',
    idle: null,
  }[authStep]

  const copy = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    toast.success('Address copied')
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Loading / in-progress ──
  if (isLoading) {
    if (variant === 'sidebar') {
      return (
        <div className="mt-1 px-2.5 py-2 text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span className="truncate">{stepLabel}</span>
        </div>
      )
    }
    return (
      <Button variant="outline" size="sm" className="rounded-full gap-2 min-w-28" disabled>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs">{stepLabel}</span>
      </Button>
    )
  }

  // ── Signed in ──
  if (isAuthenticated && walletAddress) {
    if (variant === 'sidebar') {
      return (
        <div className="mt-1 border border-border/40 rounded-lg px-2.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-xs text-foreground/80 truncate">{displayName}</span>
            </div>
            <button
              onClick={disconnectWallet}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors shrink-0"
            >
              Out
            </button>
          </div>
          <p className="text-xs font-mono text-muted-foreground/60 mt-1 truncate pl-3">{fmt(walletAddress)}</p>
        </div>
      )
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full gap-2 px-3 border-emerald-500/30 bg-emerald-500/5 max-w-48">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs truncate">{displayName}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Signed in</p>
            <p className="text-sm font-medium mt-0.5 truncate">{displayName}</p>
            <p className="text-xs font-mono text-muted-foreground/70 mt-0.5">{fmt(walletAddress)}</p>
            {dbUser?.role && (
              <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                {dbUser.role}
              </span>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copy} className="cursor-pointer">
            {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied' : 'Copy address'}
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <a href={`https://basescan.org/address/${walletAddress}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on BaseScan
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnectWallet} className="cursor-pointer text-red-400 focus:text-red-400">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // ── Not signed in — sidebar ──
  if (variant === 'sidebar') {
    return (
      <button
        onClick={() => connectWallet(0)}
        disabled={isLoading}
        className="mt-1 w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
      >
        <Wallet className="w-3.5 h-3.5 shrink-0" />
        Connect wallet to sign in
      </button>
    )
  }

  // ── Not signed in — header (dropdown wallet picker) ──
  if (showPicker) {
    return (
      <div className="flex items-center gap-2">
        {connectors.slice(0, 2).map((c, i) => (
          <Button key={c.uid} size="sm" variant="outline" className="rounded-full text-xs"
            onClick={() => { connectWallet(i); setShowPicker(false) }}>
            {c.name.toLowerCase().includes('coinbase') ? 'Coinbase' : c.name}
          </Button>
        ))}
        <Button size="sm" variant="ghost" className="text-xs text-muted-foreground"
          onClick={() => setShowPicker(false)}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" className="rounded-full gap-2"
      onClick={() => connectors.length === 1 ? connectWallet(0) : setShowPicker(true)}>
      <Wallet className="w-3.5 h-3.5" />
      Sign In
    </Button>
  )
}
