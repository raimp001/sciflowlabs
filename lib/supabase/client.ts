import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

class SupabaseConfigError extends Error {
  constructor() {
    super(
      'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    )
    this.name = 'SupabaseConfigError'
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new SupabaseConfigError()
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
