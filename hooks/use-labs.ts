"use client"

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lab } from '@/types/database'

interface LabWithStats extends Lab {
  bounties_completed?: number
  active_bounties?: number
}

interface UseLabsOptions {
  tier?: string
  search?: string
  expertise?: string[]
  limit?: number
}

interface UseLabsReturn {
  labs: LabWithStats[]
  isLoading: boolean
  error: Error | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  refetch: () => Promise<void>
  refresh: () => Promise<void>
}

export function useLabs(options: UseLabsOptions = {}): UseLabsReturn {
  const [labs, setLabs] = useState<LabWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)

  const limit = options.limit || 20

  const fetchLabs = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: String(limit),
      })

      if (options.tier && options.tier !== 'all') {
        params.set('verification_tier', options.tier)
      }
      if (options.search) {
        params.set('search', options.search)
      }
      options.expertise?.forEach(e => params.append('expertise', e))

      const response = await fetch(`/api/labs?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch labs')
      }

      setLabs(data.labs || [])
      setTotal(data.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch labs'))
      setLabs([])
    } finally {
      setIsLoading(false)
    }
  }, [limit, options.tier, options.search, options.expertise])

  useEffect(() => {
    fetchLabs()
  }, [fetchLabs])

  return {
    labs,
    isLoading,
    error,
    pagination: {
      page: 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    refetch: fetchLabs,
    refresh: fetchLabs,
  }
}

export function useLab(labId: string) {
  const [lab, setLab] = useState<LabWithStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!labId) return

    const fetchLab = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        if (!supabase) {
          setLab(null)
          return
        }

        const { data, error: queryError } = await supabase
          .from('labs')
          .select('*')
          .eq('id', labId)
          .single()

        if (queryError) throw queryError
        setLab(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch lab'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchLab()
  }, [labId])

  return { lab, isLoading, error }
}
