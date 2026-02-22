import { createClient } from '@/lib/supabase/server'
import { normalizeLab } from '@/lib/normalize/lab'
import type { Bounty, Lab } from '@/types/database'
import Link from 'next/link'

// ── helpers ──────────────────────────────────────────────────────────────

const TIER_BADGE: Record<string, string> = {
  unverified: 'bg-zinc-800 text-zinc-400',
  basic: 'bg-blue-900/60 text-blue-300',
  verified: 'bg-emerald-900/60 text-emerald-300',
  trusted: 'bg-purple-900/60 text-purple-300',
  institutional: 'bg-yellow-900/60 text-yellow-300',
}

function formatBudget(amount: number, currency: string) {
  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(amount)
  return currency === 'USDC' ? fmt.replace('$', '') + ' USDC' : fmt
}

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
}

function buildUrl(current: Record<string, string | undefined>, overrides: Record<string, string>) {
  const merged = { ...current, ...overrides }
  const params = new URLSearchParams()
  Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
  return `/bounties?${params.toString()}`
}

// ── page ─────────────────────────────────────────────────────────────────

export const revalidate = 60

export default async function BountiesPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>
}) {
  const supabase = await createClient()

  let query = supabase
    .from('bounties')
    .select('*')
    .eq('visibility', 'public')
    .in('state', ['open', 'accepting_proposals', 'funded'])
    .order('created_at', { ascending: false })

  if (searchParams.currency) query = query.eq('currency', searchParams.currency)
  if (searchParams.tier) query = query.eq('min_lab_tier', searchParams.tier)
  if (searchParams.min) query = query.gte('total_budget', Number(searchParams.min))
  if (searchParams.max) query = query.lte('total_budget', Number(searchParams.max))

  const { data: raw } = await query
  let bounties: Bounty[] = (raw ?? []) as Bounty[]

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase()
    bounties = bounties.filter(
      b => b.title.toLowerCase().includes(q) ||
           b.description.toLowerCase().includes(q) ||
           b.tags.some(t => t.toLowerCase().includes(q))
    )
  }
  if (searchParams.tag) {
    bounties = bounties.filter(b =>
      b.tags.some(t => t.toLowerCase() === searchParams.tag!.toLowerCase())
    )
  }
  if (searchParams.sort === 'budget_desc') bounties.sort((a, b) => b.total_budget - a.total_budget)
  if (searchParams.sort === 'deadline') {
    bounties.sort((a, b) => {
      if (!a.proposal_deadline) return 1
      if (!b.proposal_deadline) return -1
      return new Date(a.proposal_deadline).getTime() - new Date(b.proposal_deadline).getTime()
    })
  }

  const allTags = Array.from(new Set(bounties.flatMap(b => b.tags))).sort()

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="border-b border-white/10 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-3">
            Open to labs worldwide
          </p>
          <h1 className="font-serif text-4xl font-bold text-white mb-2">
            Open Research Bounties
          </h1>
          <p className="text-zinc-400 mb-8 max-w-xl">
            Funded opportunities from institutions, pharma, and governments.
            Apply with your lab stake — pay only for proven results.
          </p>
          <form method="GET" className="flex gap-2 max-w-xl">
            <input
              name="q"
              defaultValue={searchParams.q ?? ''}
              placeholder="Search by title, keyword, or tag…"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5
                         text-sm text-white placeholder:text-zinc-600
                         focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <button
              type="submit"
              className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-semibold
                         hover:bg-zinc-200 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-44 shrink-0 space-y-7">
          <div>
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-2">Sort</p>
            {[['', 'Newest'], ['budget_desc', 'Budget high→low'], ['deadline', 'Deadline soon']].map(
              ([val, label]) => (
                <Link key={val} href={buildUrl(searchParams, { sort: val })}
                  className={`block text-sm py-1 px-2 rounded transition-colors ${
                    (searchParams.sort ?? '') === val
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-zinc-500 hover:text-white'
                  }`}>{label}</Link>
              )
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-2">Min Tier</p>
            {[['', 'Any tier'], ['basic', 'Basic'], ['verified', 'Verified'], ['trusted', 'Trusted'], ['institutional', 'Institutional']].map(
              ([val, label]) => (
                <Link key={val} href={buildUrl(searchParams, { tier: val })}
                  className={`block text-sm py-1 px-2 rounded transition-colors ${
                    (searchParams.tier ?? '') === val
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-zinc-500 hover:text-white'
                  }`}>{label}</Link>
              )
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-2">Currency</p>
            {[['', 'Any'], ['USD', 'USD'], ['USDC', 'USDC']].map(([val, label]) => (
              <Link key={val} href={buildUrl(searchParams, { currency: val })}
                className={`block text-sm py-1 px-2 rounded transition-colors ${
                  (searchParams.currency ?? '') === val
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-zinc-500 hover:text-white'
                }`}>{label}</Link>
            ))}
          </div>

          {allTags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {allTags.slice(0, 18).map(tag => (
                  <Link key={tag} href={buildUrl(searchParams, { tag })}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      searchParams.tag === tag
                        ? 'bg-white text-black border-white'
                        : 'border-white/20 text-zinc-500 hover:border-white/50 hover:text-zinc-300'
                    }`}>{tag}</Link>
                ))}
              </div>
            </div>
          )}

          {Object.values(searchParams).some(Boolean) && (
            <Link href="/bounties" className="text-xs text-red-400 hover:underline block">Clear filters</Link>
          )}
        </aside>

        {/* Bounty list */}
        <section className="flex-1 min-w-0">
          <p className="text-xs text-zinc-600 mb-4">
            {bounties.length} bounty{bounties.length !== 1 ? 'ies' : ''} found
          </p>

          {bounties.length === 0 ? (
            <div className="text-center py-24 text-zinc-700">
              No bounties match your filters.
            </div>
          ) : (
            <ul className="space-y-3">
              {bounties.map(bounty => {
                const days = daysLeft(bounty.proposal_deadline)
                return (
                  <li key={bounty.id}
                    className="bg-white/[0.03] border border-white/10 rounded-xl p-5
                               hover:border-white/25 hover:bg-white/[0.05] transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link href={`/bounties/${bounty.id}`}
                          className="text-base font-semibold text-white hover:text-zinc-300
                                     line-clamp-1 transition-colors">
                          {bounty.title}
                        </Link>
                        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{bounty.description}</p>
                        {bounty.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {bounty.tags.slice(0, 5).map(tag => (
                              <span key={tag}
                                className="text-xs bg-white/5 text-zinc-500 px-2 py-0.5 rounded-full border border-white/10">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0 space-y-2">
                        <p className="text-lg font-bold text-white">
                          {formatBudget(bounty.total_budget, bounty.currency)}
                        </p>
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          TIER_BADGE[bounty.min_lab_tier] ?? 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {bounty.min_lab_tier}+ tier
                        </span>
                        {days !== null && (
                          <p className={`text-xs ${
                            days <= 3 ? 'text-red-400 font-semibold' :
                            days <= 7 ? 'text-orange-400' : 'text-zinc-600'
                          }`}>
                            {days > 0 ? `${days}d left` : 'Deadline passed'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        bounty.state === 'funded'
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : 'bg-blue-900/60 text-blue-300'
                      }`}>
                        {bounty.state.replace(/_/g, ' ')}
                      </span>
                      <Link href={`/bounties/${bounty.id}`}
                        className="text-sm text-white/60 hover:text-white font-medium transition-colors">
                        View & Apply →
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
