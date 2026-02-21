"use client"

import {
  createContext, useContext, useEffect, useState,
  useCallback, useRef, type ReactNode,
} from 'react'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { base } from 'wagmi/chains'
import { createClient } from '@/lib/supabase/client'
import type { User as DbUser, Lab } from '@/types/database'
import { toast } from 'sonner'

type AuthStep = 'idle' | 'connecting' | 'signing' | 'authenticating'

interface AuthContextType {
  // Wallet / auth state
  isAuthenticated: boolean
  isLoading: boolean
  walletAddress: string | null
  authStep: AuthStep
  authError: string | null

  // DB profile
  dbUser: DbUser | null
  lab: Lab | null
  isFunder: boolean
  isLab: boolean
  isAdmin: boolean

  // Actions
  connectWallet: (connectorIndex: number) => void
  disconnectWallet: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()

  const [authStep, setAuthStep] = useState<AuthStep>('idle')
  const [authError, setAuthError] = useState<string | null>(null)
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [lab, setLab] = useState<Lab | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const authInProgress = useRef(false)

  const supabase = createClient()

  // Load DB profile after wallet auth
  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userData) {
      setDbUser(userData)
      if (userData.role === 'lab') {
        const { data: labData } = await supabase
          .from('labs').select('*').eq('user_id', userId).single()
        setLab(labData)
      }
    }
  }, [supabase])

  // On mount — check for existing Supabase session (persists across refreshes)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true)
        await loadProfile(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true)
        await loadProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        setDbUser(null)
        setLab(null)
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When wallet connects while we're in the "connecting" step, run auth
  useEffect(() => {
    if (isConnected && address && authStep === 'connecting' && !authInProgress.current) {
      authInProgress.current = true
      authenticateWallet(address).finally(() => { authInProgress.current = false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, authStep])

  const authenticateWallet = async (walletAddress: string) => {
    try {
      setAuthStep('signing')
      setAuthError(null)

      // Get challenge from server
      const res = await fetch(`/api/auth/wallet?address=${walletAddress}`)
      if (!res.ok) throw new Error('Failed to get sign-in challenge')
      const { message } = await res.json()

      // Sign with the wallet (supports EIP-1271 for Smart Wallet)
      const signature = await signMessageAsync({ message })

      setAuthStep('authenticating')

      // Verify + get Supabase credentials
      const authRes = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress, signature, message }),
      })

      const authData = await authRes.json()
      if (!authRes.ok) {
        throw new Error(authData.error || `Server error (${authRes.status})`)
      }

      const { email, tempPassword } = authData

      // Sign into Supabase — creates a persistent session
      if (supabase) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: tempPassword })
        if (signInError) throw signInError
      }

      setAuthStep('idle')
      toast.success('Signed in')
    } catch (err) {
      disconnect()
      const msg = err instanceof Error ? err.message : 'Sign-in failed'
      if (!msg.includes('User rejected') && !msg.includes('user rejected')) {
        setAuthError(msg)
        toast.error(msg)
      }
      setAuthStep('idle')
    }
  }

  const connectWallet = useCallback((connectorIndex: number) => {
    setAuthError(null)
    setAuthStep('connecting')
    const c = connectors[connectorIndex]
    if (!c) { setAuthStep('idle'); return }
    connect({ connector: c, chainId: base.id }, {
      onError: (err) => {
        if (!err.message.includes('rejected')) setAuthError(err.message)
        setAuthStep('idle')
      },
    })
  }, [connect, connectors])

  const disconnectWallet = useCallback(async () => {
    disconnect()
    if (supabase) await supabase.auth.signOut()
    setIsAuthenticated(false)
    setDbUser(null)
    setLab(null)
    setAuthStep('idle')
    setAuthError(null)
    toast.success('Signed out')
  }, [disconnect, supabase])

  const refreshUser = useCallback(async () => {
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await loadProfile(session.user.id)
  }, [supabase, loadProfile])

  const stepLabel = {
    connecting: 'Opening wallet…',
    signing: 'Approve sign-in in wallet…',
    authenticating: 'Signing you in…',
    idle: null,
  }[authStep]

  const isLoading = authStep !== 'idle'

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      walletAddress: address ?? null,
      authStep,
      authError,
      dbUser,
      lab,
      isFunder: dbUser?.role === 'funder' || dbUser?.role === 'admin',
      isLab: dbUser?.role === 'lab',
      isAdmin: dbUser?.role === 'admin',
      connectWallet,
      disconnectWallet,
      refreshUser,
    }}>
      {/* Auth step banner */}
      {authStep !== 'idle' && (
        <div className="fixed top-0 inset-x-0 z-50 bg-accent/10 border-b border-accent/20 px-4 py-2 flex items-center justify-center gap-2">
          <span className="animate-spin text-accent text-xs">⟳</span>
          <span className="text-sm text-foreground">{stepLabel}</span>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
