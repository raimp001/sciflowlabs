"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, ArrowUpRight } from "lucide-react"
import { useBounties } from "@/hooks/use-bounties"
import { CreateBountyModal } from "@/components/create-bounty-modal"
import Link from "next/link"

const stateColors: Record<string, string> = {
  drafting: "bg-secondary text-muted-foreground",
  funding_escrow: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  bidding: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  active_research: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  milestone_review: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  dispute_resolution: "bg-red-500/20 text-red-400 border border-red-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  cancelled: "bg-secondary text-muted-foreground",
}

const stateLabels: Record<string, string> = {
  drafting: "Draft",
  funding_escrow: "Funding",
  bidding: "Bidding",
  active_research: "Active",
  milestone_review: "Review",
  dispute_resolution: "Dispute",
  completed: "Completed",
  cancelled: "Cancelled",
}

function formatCurrency(amount: number, currency: string) {
  return currency === "USD" 
    ? `$${amount.toLocaleString()}` 
    : `${amount.toLocaleString()} ${currency}`
}

export default function BountiesPage() {
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  
  const { bounties, isLoading, error, pagination } = useBounties({
    state: filter === "all" ? undefined : filter,
    search: search || undefined,
  })

  const counts = {
    active: bounties.filter(b => 
      ["active_research", "milestone_review", "bidding", "funding_escrow"].includes(b.current_state)
    ).length,
    drafts: bounties.filter(b => b.current_state === "drafting").length,
    completed: bounties.filter(b => b.current_state === "completed").length,
    disputes: bounties.filter(b => b.current_state === "dispute_resolution").length,
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-foreground">Bounties</h1>
        <CreateBountyModal />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active", value: counts.active },
          { label: "Drafts", value: counts.drafts },
          { label: "Completed", value: counts.completed, color: "text-emerald-400" },
          { label: "Disputes", value: counts.disputes, color: "text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="text-center py-3">
            <p className={`text-2xl font-medium ${stat.color || "text-foreground"}`}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="drafting">Draft</SelectItem>
            <SelectItem value="funding_escrow">Funding</SelectItem>
            <SelectItem value="bidding">Bidding</SelectItem>
            <SelectItem value="active_research">Active</SelectItem>
            <SelectItem value="milestone_review">Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="dispute_resolution">Dispute</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-border/30">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Unable to load bounties</p>
        </div>
      ) : bounties.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-foreground font-medium mb-1">
            {search ? "No results" : "No bounties yet"}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {search ? "Try different keywords" : "Create your first research bounty"}
          </p>
          {!search && (
            <CreateBountyModal 
              trigger={
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Create Bounty
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {bounties.map((bounty) => (
            <Link key={bounty.id} href={`/dashboard/bounties/${bounty.id}`} className="block">
              <div className="flex items-center gap-4 py-4 px-1 group cursor-pointer hover:bg-secondary/20 -mx-1 rounded-lg transition-colors">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate group-hover:text-accent transition-colors">
                    {bounty.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatCurrency(bounty.total_budget || 0, bounty.currency || "USD")}
                    {bounty.selected_lab && (
                      <span className="ml-2">· {bounty.selected_lab.name}</span>
                    )}
                  </p>
                </div>
                <Badge className={stateColors[bounty.current_state] || stateColors.drafting}>
                  {stateLabels[bounty.current_state] || bounty.current_state}
                </Badge>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.total > 0 && (
        <p className="text-xs text-center text-muted-foreground/50 pt-2">
          {bounties.length} of {pagination.total}
        </p>
      )}
    </div>
  )
}
