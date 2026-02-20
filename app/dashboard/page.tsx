"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, ArrowRight, RefreshCw } from "lucide-react"
import { CreateBountyModal } from "@/components/create-bounty-modal"
import { useBounties } from "@/hooks/use-bounties"
import Link from "next/link"
import { useMemo } from "react"

const stateColors: Record<string, string> = {
  drafting: "bg-secondary text-muted-foreground border-0",
  funding_escrow: "bg-amber-500/15 text-amber-400 border-0",
  bidding: "bg-blue-500/15 text-blue-400 border-0",
  active_research: "bg-emerald-500/15 text-emerald-400 border-0",
  milestone_review: "bg-orange-500/15 text-orange-400 border-0",
  dispute_resolution: "bg-red-500/15 text-red-400 border-0",
  completed: "bg-emerald-500/15 text-emerald-400 border-0",
  cancelled: "bg-secondary text-muted-foreground border-0",
}

const stateLabels: Record<string, string> = {
  drafting: "Draft",
  funding_escrow: "Funding",
  bidding: "Open",
  active_research: "Active",
  milestone_review: "Review",
  dispute_resolution: "Dispute",
  completed: "Done",
  cancelled: "Cancelled",
}

function formatCurrency(amount: number, currency: string) {
  return currency === "USD"
    ? `$${amount.toLocaleString()}`
    : `${amount.toLocaleString()} ${currency}`
}

export default function DashboardPage() {
  const { bounties, isLoading, error, refresh } = useBounties({ limit: 8 })

  const stats = useMemo(() => ({
    active: bounties.filter(b =>
      ["active_research", "milestone_review", "bidding", "funding_escrow"].includes(b.state)
    ).length,
    total: bounties.reduce((sum, b) => sum + (b.total_budget || 0), 0),
    completed: bounties.filter(b => b.state === "completed").length,
    disputes: bounties.filter(b => b.state === "dispute_resolution").length,
  }), [bounties])

  const hasError = error !== null
  const isEmpty = !isLoading && !hasError && bounties.length === 0

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-2">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-foreground">Dashboard</h1>
        <CreateBountyModal />
      </div>

      {/* Stats — plain numbers, Scandinavian style */}
      <div className="grid grid-cols-4 divide-x divide-border/40 border border-border/40 rounded-xl overflow-hidden">
        {[
          { label: "Active", value: stats.active },
          { label: "Total value", value: formatCurrency(stats.total, "USD") },
          { label: "Completed", value: stats.completed },
          { label: "Disputes", value: stats.disputes },
        ].map((stat) => (
          <div key={stat.label} className="p-4 text-center">
            <p className="text-lg font-medium text-foreground tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent bounties */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Recent bounties</p>
          <Link href="/dashboard/bounties">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-2">
              All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border/30 border border-border/40 rounded-xl overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-5 w-14 rounded-md" />
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="py-10 text-center border border-border/40 rounded-xl">
            <p className="text-sm text-muted-foreground mb-3">Unable to load bounties</p>
            <Button variant="outline" size="sm" onClick={() => refresh()} className="rounded-full">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        ) : isEmpty ? (
          <div className="py-12 text-center border border-border/40 rounded-xl border-dashed">
            <p className="text-sm font-medium text-foreground mb-1">No bounties yet</p>
            <p className="text-xs text-muted-foreground mb-5">Create your first research bounty to get started</p>
            <CreateBountyModal
              trigger={
                <Button size="sm" className="rounded-full">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Bounty
                </Button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-border/30 border border-border/40 rounded-xl overflow-hidden">
            {bounties.map((bounty) => (
              <Link key={bounty.id} href={`/dashboard/bounties/${bounty.id}`} className="block">
                <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/20 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                      {bounty.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(bounty.total_budget || 0, bounty.currency || "USD")}
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

      {/* CTA — only when has bounties */}
      {!isEmpty && !isLoading && (
        <div className="flex items-center justify-between py-4 border-t border-border/30">
          <p className="text-sm text-muted-foreground">Ready to fund new research?</p>
          <CreateBountyModal
            trigger={
              <Button size="sm" className="rounded-full">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> New Bounty
              </Button>
            }
          />
        </div>
      )}
    </div>
  )
}
