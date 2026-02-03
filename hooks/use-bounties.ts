"use client"

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bounty, Milestone, Proposal, Escrow } from '@/types/database'

interface BountyWithRelations extends Bounty {
  funder?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  selected_lab?: {
    id: string
    name: string
    verification_tier: string
    reputation_score: number
  } | null
  milestones?: Milestone[]
  proposals?: Proposal[]
  escrow?: Escrow | null
}

interface UseBountiesOptions {
  state?: string
  search?: string
  tags?: string[]
  myBounties?: boolean
  limit?: number
}

interface UseBountiesReturn {
  bounties: BountyWithRelations[]
  isLoading: boolean
  error: Error | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  fetchMore: () => Promise<void>
  refresh: () => Promise<void>
  hasMore: boolean
}

export function useBounties(options: UseBountiesOptions = {}): UseBountiesReturn {
  const [bounties, setBounties] = useState<BountyWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const limit = options.limit || 20

  const fetchBounties = useCallback(async (pageNum: number, append = false) => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(limit),
      })

      if (options.state) params.set('state', options.state)
      if (options.search) params.set('search', options.search)
      if (options.myBounties) params.set('my', 'true')
      options.tags?.forEach(tag => params.append('tag', tag))

      const response = await fetch(`/api/bounties?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bounties')
      }

      if (append) {
        setBounties(prev => [...prev, ...data.bounties])
      } else {
        setBounties(data.bounties)
      }
      setTotal(data.pagination.total)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [limit, options.state, options.search, options.myBounties, options.tags])

  const fetchMore = useCallback(async () => {
    if (page * limit < total) {
      await fetchBounties(page + 1, true)
    }
  }, [page, limit, total, fetchBounties])

  const refresh = useCallback(async () => {
    await fetchBounties(1, false)
  }, [fetchBounties])

  useEffect(() => {
    fetchBounties(1, false)
  }, [fetchBounties])

  return {
    bounties,
    isLoading,
    error,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    fetchMore,
    refresh,
    hasMore: page * limit < total,
  }
}

interface UseBountyReturn {
  bounty: BountyWithRelations | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  transition: (event: string, data?: Record<string, unknown>) => Promise<{
    success: boolean
    error?: string
    newState?: string
  }>
}

export function useBounty(bountyId: string): UseBountyReturn {
  const [bounty, setBounty] = useState<BountyWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBounty = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/bounties/${bountyId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bounty')
      }

      setBounty(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [bountyId])

  const transition = useCallback(async (event: string, data?: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/bounties/${bountyId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error }
      }

      // Refresh bounty data
      await fetchBounty()

      return { success: true, newState: result.newState }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      }
    }
  }, [bountyId, fetchBounty])

  useEffect(() => {
    if (bountyId) {
      fetchBounty()
    }
  }, [bountyId, fetchBounty])

  // Set up real-time subscription with debouncing to prevent excessive refetches
  useEffect(() => {
    if (!bountyId) return

    const supabase = createClient()
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let pendingRefetch = false

    // Debounced refetch to batch multiple rapid updates into one request
    const debouncedRefetch = () => {
      if (debounceTimer) {
        pendingRefetch = true
        return
      }

      fetchBounty()
      debounceTimer = setTimeout(() => {
        debounceTimer = null
        if (pendingRefetch) {
          pendingRefetch = false
          fetchBounty()
        }
      }, 500) // 500ms debounce window
    }

    const channel = supabase
      .channel(`bounty:${bountyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bounties',
          filter: `id=eq.${bountyId}`,
        },
        (payload) => {
          // For bounty updates, merge directly without full refetch
          setBounty(prev => prev ? { ...prev, ...payload.new } : null)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'milestones',
          filter: `bounty_id=eq.${bountyId}`,
        },
        () => {
          // Use debounced refetch for related data changes
          debouncedRefetch()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proposals',
          filter: `bounty_id=eq.${bountyId}`,
        },
        () => {
          // Use debounced refetch for related data changes
          debouncedRefetch()
        }
      )
      .subscribe()

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      supabase.removeChannel(channel)
    }
  }, [bountyId, fetchBounty])

  return {
    bounty,
    isLoading,
    error,
    refresh: fetchBounty,
    transition,
  }
}

// Create bounty hook
interface CreateBountyData {
  title: string
  description: string
  methodology: string
  data_requirements?: string[]
  quality_standards?: string[]
  total_budget: number
  currency?: 'USD' | 'USDC'
  deadline?: string
  tags?: string[]
  visibility?: 'public' | 'private' | 'invite_only'
  min_lab_tier?: string
  milestones: Array<{
    title: string
    description: string
    deliverables: string[]
    payout_percentage: number
    due_date?: string
  }>
}

export function useCreateBounty() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createBounty = useCallback(async (data: CreateBountyData) => {
    try {
      setIsCreating(true)
      setError(null)

      const response = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create bounty')
      }

      return { success: true, bounty: result }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      return { success: false, error: error.message }
    } finally {
      setIsCreating(false)
    }
  }, [])

  return { createBounty, isCreating, error }
}
