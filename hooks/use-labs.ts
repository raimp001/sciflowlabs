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
  specialty?: string
  limit?: number
}

interface UseLabsReturn {
  labs: LabWithStats[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function useLabs(options: UseLabsOptions = {}): UseLabsReturn {
  const [labs, setLabs] = useState<LabWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchLabs = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      
      if (!supabase) {
        setLabs([])
        return
      }

      let query = supabase
        .from('labs')
        .select('*')
        .order('reputation_score', { ascending: false })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.tier && options.tier !== 'all') {
        query = query.eq('verification_tier', options.tier)
      }

      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,specialties.cs.{${options.search}}`)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      setLabs(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch labs'))
      setLabs([])
    } finally {
      setIsLoading(false)
    }
  }, [options.tier, options.search, options.limit])

  useEffect(() => {
    fetchLabs()
  }, [fetchLabs])

  return {
    labs,
    isLoading,
    error,
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
