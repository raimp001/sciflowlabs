import { type NextRequest, NextResponse } from 'next/server'

// Check if Supabase is configured
const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export async function middleware(request: NextRequest) {
  // If Supabase is not configured, just pass through
  if (!hasSupabase) {
    return NextResponse.next()
  }

  // Dynamic import to avoid errors when Supabase is not configured
  const { updateSession } = await import('@/lib/supabase/middleware')
  
  // Update session and get response
  const response = await updateSession(request)
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (auth endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
}
