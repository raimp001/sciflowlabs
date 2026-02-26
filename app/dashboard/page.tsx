"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, ArrowRight, RefreshCw, Search, FlaskConical, DollarSign, Send } from "lucide-react"
import { CreateBountyModal } from "@/components/create-bounty-modal"
import { useBounties } from "@/hooks/use-bounties"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { useMemo } from "react"

// Plain-English state labels
const stateColors: Record<string, string> = {
  admin_review:       "bg-amber-500/15 text-amber-400 border-0",
  drafting:           "bg-secondary text-muted-foreground border-0",
  funding_escrow:     "bg-amber-500/15 text-amber-400 border-0",
  bidding:            "bg-blue-500/15 text-blue-400 border-0",
  active_research:    "bg-emerald-500/15 text-emerald-400 border-0",
  milestone_review:   "bg-orange-500/15 text-orange-400 border-0",
  dispute_resolution: "bg-red-500/15 text-red-400 border-0",
  completed:          "bg-emerald-500/15 text-emerald-400 border-0",
  cancelled:          "bg-secondary text-muted-foreground border-0",
}

const stateLabels: Record<string, string> = {
  admin_review:       "Under review",
  drafting:           "Draft",
  funding_escrow:     "Awaiting payment",
  bidding:            "Accepting proposals",
  active_research:    "Research ongoing",
  milestone_review:   "Waiting your review",
  dispute_resolution: "In dispute",
  completed:          "Completed",
  cancelled:          "Cancelled",
}

function fmt(amount: number, currency: string) {
  return currency === "USD" ? `$${amount.toLocaleString()}` : `${amount.toLocaleString()} ${currency}`
}

// ── Funder dashboard ─────────────────────────────────────────────
function FunderDashboard() {
  const { bounties, isLoading, error, refresh } = useBounties({ limit: 8, myBounties: true })

  const stats = useMemo(() => ({
    active: bounties.filter(b => ["active_research", "milestone_review", "bidding"].includes(b.state)).length,
    total: bounties.reduce((sum, b) => sum + (b.total_budget || 0), 0),
    completed: bounties.filter(b => b.state === "completed").length,
    needsAttention: bounties.filter(b => b.state === "milestone_review").length,
  }), [bounties])

  const isEmpty = !isLoading && bounties.length === 0

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-foreground">My Research Projects</h1>
        <CreateBountyModal />
      </div>

      {/* Needs attention banner */}
      {stats.needsAttention > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div>
            <p className="text-sm font-medium text-orange-300">Action needed</p>
            <p className="text-xs text-orange-300/70 mt-0.5">
              {stats.needsAttention} milestone{stats.needsAttention > 1 ? 's' : ''} submitted — review and approve to release payment
            </p>
          </div>
          <Button asChild size="sm" className="rounded-full bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border-0">
            <Link href="/dashboard/bounties?state=milestone_review">Review now →</Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      {bounties.length > 0 && (
        <div className="grid grid-cols-3 divide-x divide-border/40 border border-border/40 rounded-xl overflow-hidden">
          <div className="p-4 text-center">
            <p className="text-lg font-medium text-foreground">{stats.active}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Active projects</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-lg font-medium text-foreground">{fmt(stats.total, "USD")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total funded</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-lg font-medium text-emerald-400">{stats.completed}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
          </div>
        </div>
      )}

      {/* Projects list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="divide-y divide-border/30 border border-border/40 rounded-xl overflow-hidden">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="flex-1"><Skeleton className="h-4 w-2/3 mb-2" /><Skeleton className="h-3 w-1/4" /></div>
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-10 text-center border border-border/40 rounded-xl">
            <p className="text-sm text-muted-foreground mb-3">Could not load projects</p>
            <Button variant="outline" size="sm" onClick={() => refresh()} className="rounded-full">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        ) : isEmpty ? (
          /* Empty state — funder hasn't posted anything yet */
          <div className="space-y-4">
            <div className="py-10 text-center border border-border/40 rounded-xl border-dashed">
              <DollarSign className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground mb-1">No projects yet</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Post a research question. Verified labs will submit proposals. You only pay when they deliver results.
              </p>
              <CreateBountyModal
                trigger={
                  <Button className="rounded-full gap-2">
                    <Plus className="w-4 h-4" /> Post your first project
                  </Button>
                }
              />
            </div>

            {/* Quick guide */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { n: "1", label: "Post a project", desc: "Describe what research you need done and set a budget" },
                { n: "2", label: "Pick a lab", desc: "Labs submit proposals. You choose who to work with" },
                { n: "3", label: "Pay on results", desc: "Funds release milestone by milestone — only on verified proof" },
              ].map(s => (
                <div key={s.n} className="p-4 border border-border/30 rounded-xl">
                  <p className="text-xs text-muted-foreground/50 font-mono mb-1">{s.n}</p>
                  <p className="text-sm font-medium text-foreground mb-1">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/30 border border-border/40 rounded-xl overflow-hidden">
            {bounties.map(bounty => (
              <Link key={bounty.id} href={`/dashboard/bounties/${bounty.id}`} className="block">
                <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/20 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                      {bounty.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fmt(bounty.total_budget || 0, bounty.currency || "USD")}
                    </p>
                  </div>
                  <Badge className={stateColors[bounty.state] || stateColors.drafting}>
                    {stateLabels[bounty.state] || bounty.state}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Lab dashboard ────────────────────────────────────────────────
function LabDashboard() {
  const { bounties: activeWork, isLoading } = useBounties({ state: "active_research" })

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-foreground">My Research Work</h1>
        <Button asChild className="rounded-full gap-2" size="sm">
          <Link href="/dashboard/open-bounties">
            <Search className="w-3.5 h-3.5" /> Find Projects
          </Link>
        </Button>
      </div>

      {/* Active assignment */}
      {isLoading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : activeWork.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Active assignments</p>
          <div className="divide-y divide-border/30 border border-border/40 rounded-xl overflow-hidden">
            {activeWork.map(b => (
              <Link key={b.id} href={`/dashboard/bounties/${b.id}`} className="block">
                <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/20 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-accent">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{fmt(b.total_budget || 0, b.currency || "USD")}</p>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-0">Active</Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/dashboard/open-bounties">
          <div className="p-5 border border-border/40 rounded-xl hover:border-border transition-colors group cursor-pointer">
            <Search className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-foreground" />
            <p className="font-medium text-sm text-foreground">Browse open projects</p>
            <p className="text-xs text-muted-foreground mt-1">Find funded research you can apply for</p>
          </div>
        </Link>
        <Link href="/dashboard/proposals">
          <div className="p-5 border border-border/40 rounded-xl hover:border-border transition-colors group cursor-pointer">
            <Send className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-foreground" />
            <p className="font-medium text-sm text-foreground">My applications</p>
            <p className="text-xs text-muted-foreground mt-1">Track proposals you've submitted</p>
          </div>
        </Link>
      </div>

      {activeWork.length === 0 && (
        <div className="py-10 text-center border border-border/40 rounded-xl border-dashed">
          <FlaskConical className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium text-foreground mb-1">No active projects</p>
          <p className="text-sm text-muted-foreground mb-5">Browse open projects and submit a proposal to get started</p>
          <Button asChild className="rounded-full gap-2">
            <Link href="/dashboard/open-bounties">
              <Search className="w-4 h-4" /> Browse open projects
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Not onboarded yet ─────────────────────────────────────────────
function WelcomeDashboard() {
  return (
    <div className="max-w-2xl mx-auto py-16 text-center space-y-8">
      <div>
        <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-xl font-bold text-accent">S</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome to SciFlow</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          The marketplace connecting research funders with verified labs. 
          Tell us how you want to use SciFlow.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-left">
        <Link href="/onboarding">
          <div className="p-6 border-2 border-border/40 rounded-2xl hover:border-blue-400/50 hover:bg-blue-500/5 transition-all cursor-pointer">
            <DollarSign className="w-6 h-6 text-blue-400 mb-3" />
            <p className="font-medium text-foreground mb-1">I want to fund research</p>
            <p className="text-sm text-muted-foreground">Post projects, pick labs, pay on results</p>
          </div>
        </Link>
        <Link href="/onboarding">
          <div className="p-6 border-2 border-border/40 rounded-2xl hover:border-emerald-400/50 hover:bg-emerald-500/5 transition-all cursor-pointer">
            <FlaskConical className="w-6 h-6 text-emerald-400 mb-3" />
            <p className="font-medium text-foreground mb-1">I am a researcher</p>
            <p className="text-sm text-muted-foreground">Find funded projects, submit proposals, get paid</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { dbUser, isAuthenticated, isLoading } = useAuth()

// Still bootstrapping — show skeleton, not WelcomeDashboard
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    )
  }

  if (!isAuthenticated) return <WelcomeDashboard />

  // Authenticated but profile still loading — show skeleton
  if (!dbUser) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    )
  }

  const role = dbUser?.role
  if (role === 'funder' || role === 'admin') return <FunderDashboard />
  if (role === 'lab') return <LabDashboard />
  // Role not set — redirect to onboarding
  if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
    window.location.href = '/onboarding'
  }
  return <WelcomeDashboard />
