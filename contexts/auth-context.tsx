"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode, useMemo } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { createClient } from '@/lib/supabase/client'
import type { User as DbUser, Lab } from '@/types/database'

interface AuthContextType {
  // Privy state
  privyReady: boolean
  privyAuthenticated: boolean
  privyUser: ReturnType<typeof usePrivy>['user']
  // App state
  dbUser: DbUser | null
  lab: Lab | null
  walletAddress: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isFunder: boolean
  isLab: boolean
  isAdmin: boolean
  isConfigured: boolean
  // Privy auth actions (login/logout handled by Privy modal)
  login: () => void
  logout: () => Promise<void>
  // Legacy Supabase auth (still available for direct email/password)
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (email: string, password: string, fullName: string, role: 'funder' | 'lab') => Promise<{ error: Error | null }>
  signInWithWallet: (provider: 'solana' | 'evm', address: string, signature: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user: privyUser, login, logout: privyLogout } = usePrivy()
  const { wallets } = useWallets()

  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [lab, setLab] = useState<Lab | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])
  const isConfigured = !!supabase

  // Get primary wallet address from Privy
  const walletAddress = useMemo(() => {
    if (wallets.length > 0) return wallets[0].address
    if (privyUser?.wallet) return privyUser.wallet.address
    if (dbUser?.wallet_address_evm) return dbUser.wallet_address_evm
    if (dbUser?.wallet_address_solana) return dbUser.wallet_address_solana
    return null
  }, [wallets, privyUser, dbUser])

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError
      setDbUser(userData)

      if (userData.role === 'lab') {
        const { data: labData } = await supabase
          .from('labs')
          .select('*')
          .eq('user_id', userId)
          .single()
        setLab(labData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }, [supabase])

  // Sync Privy auth state with Supabase user profile
  useEffect(() => {
    if (!ready) return

    const syncPrivyUser = async () => {
      if (authenticated && privyUser) {
        // Try to find or create user in Supabase by Privy ID or email
        const email = privyUser.email?.address
        const privyId = privyUser.id

        if (email) {
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

          if (existingUser) {
            setDbUser(existingUser)
            // Update wallet address if we have one from Privy
            const wallet = privyUser.wallet?.address
            if (wallet && !existingUser.wallet_address_evm) {
              await supabase
                .from('users')
                .update({ wallet_address_evm: wallet })
                .eq('id', existingUser.id)
            }
            if (existingUser.role === 'lab') {
              const { data: labData } = await supabase
                .from('labs')
                .select('*')
                .eq('user_id', existingUser.id)
                .single()
              setLab(labData)
            }
          }
        }
      } else {
        setDbUser(null)
        setLab(null)
      }
      setIsLoading(false)
    }

    syncPrivyUser()
  }, [ready, authenticated, privyUser, supabase])

  // Also listen for Supabase auth changes (for legacy email/password login)
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && !dbUser) {
          await fetchUserData(session.user.id)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        if (!authenticated) setIsLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === 'SIGNED_IN' && currentSession?.user) {
          await fetchUserData(currentSession.user.id)
        } else if (event === 'SIGNED_OUT') {
          setDbUser(null)
          setLab(null)
        }
        setIsLoading(false)
      }
    )

    return () => { subscription.unsubscribe() }
  }, [supabase, fetchUserData, authenticated, dbUser])

  const refreshUser = useCallback(async () => {
    if (dbUser?.id) {
      await fetchUserData(dbUser.id)
    }
  }, [dbUser?.id, fetchUserData])

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Authentication not configured.') }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUpWithEmail = async (email: string, password: string, fullName: string, role: 'funder' | 'lab') => {
    if (!supabase) return { error: new Error('Authentication not configured.') }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      })

      if (error) return { error }

      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role,
        })
        if (profileError) return { error: profileError as Error }

        if (role === 'lab') {
          const { error: labError } = await supabase.from('labs').insert({
            user_id: data.user.id,
            name: fullName,
          })
          if (labError) return { error: labError as Error }
        }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signInWithWallet = async (provider: 'solana' | 'evm', address: string, signature: string) => {
    if (!supabase) return { error: new Error('Authentication not configured.') }
    try {
      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, address, signature }),
      })
      const result = await response.json()
      if (!response.ok) return { error: new Error(result.error || 'Wallet authentication failed') }

      const { error } = await supabase.auth.signInWithPassword({
        email: result.email,
        password: result.tempPassword,
      })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    if (authenticated) await privyLogout()
    if (supabase) await supabase.auth.signOut()
    setDbUser(null)
    setLab(null)
  }

  const value: AuthContextType = {
    privyReady: ready,
    privyAuthenticated: authenticated,
    privyUser,
    dbUser,
    lab,
    walletAddress,
    isLoading,
    isAuthenticated: authenticated || !!dbUser,
    isFunder: dbUser?.role === 'funder',
    isLab: dbUser?.role === 'lab',
    isAdmin: dbUser?.role === 'admin',
    isConfigured,
    login,
    logout: signOut,
    signInWithEmail,
    signUpWithEmail,
    signInWithWallet,
    signOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
