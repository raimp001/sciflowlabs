"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import type { User as DbUser, Lab } from '@/types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  dbUser: DbUser | null
  lab: Lab | null
  isLoading: boolean
  isAuthenticated: boolean
  isFunder: boolean
  isLab: boolean
  isAdmin: boolean
  isConfigured: boolean
  walletAddress: string | null
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (email: string, password: string, fullName: string, role: 'funder' | 'lab') => Promise<{ error: Error | null }>
  signInWithWallet: (provider: 'solana' | 'evm', address: string, signature: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [lab, setLab] = useState<Lab | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const supabase = useMemo(() => createClient(), [])
  const isConfigured = !!supabase

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError
      setDbUser(userData)

      // If user is a lab, fetch lab data
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

  const refreshUser = useCallback(async () => {
    if (user?.id) {
      await fetchUserData(user.id)
    }
  }, [user?.id, fetchUserData])

  useEffect(() => {
    // If Supabase is not configured, skip auth initialization
    if (!supabase) {
      setIsLoading(false)
      return
    }

    // Initial session check
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        
        if (currentSession?.user) {
          await fetchUserData(currentSession.user.id)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (event === 'SIGNED_IN' && currentSession?.user) {
          await fetchUserData(currentSession.user.id)
        } else if (event === 'SIGNED_OUT') {
          setDbUser(null)
          setLab(null)
        }

        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserData])

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Authentication not configured. Please set up Supabase.') }
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUpWithEmail = async (email: string, password: string, fullName: string, role: 'funder' | 'lab') => {
    if (!supabase) {
      return { error: new Error('Authentication not configured. Please set up Supabase.') }
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      })

      if (error) return { error }

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role,
        })

        if (profileError) return { error: profileError as Error }

        // If lab, create lab profile
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
    if (!supabase) {
      return { error: new Error('Authentication not configured. Please set up Supabase.') }
    }
    try {
      // Verify signature on the server
      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, address, signature }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        return { error: new Error(result.error || 'Wallet authentication failed') }
      }

      // Sign in with the returned token
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
    if (supabase) {
      await supabase.auth.signOut()
    }
    setDbUser(null)
    setLab(null)
  }

  const walletAddress = dbUser?.wallet_address_evm || dbUser?.wallet_address_solana || null

  const value: AuthContextType = {
    user,
    session,
    dbUser,
    lab,
    isLoading,
    isAuthenticated: !!user,
    isFunder: dbUser?.role === 'funder',
    isLab: dbUser?.role === 'lab',
    isAdmin: dbUser?.role === 'admin',
    isConfigured,
    walletAddress,
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
