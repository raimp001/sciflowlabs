"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { Plus, Search, FlaskConical, ArrowUpRight } from "lucide-react"
import { useBounties } from "@/hooks/use-bounties"
import { CreateBountyModal } from "@/components/create-bounty-modal"
import Link from "next/link"

const stateColors: Record<string, string> = {
  drafting: "bg-slate-100 text-slate-700",
  funding_escrow: "bg-amber-100 text-amber-700",
  bidding: "bg-blue-100 text-blue-700",
  active_research: "bg-emerald-100 text-emerald-700",
  milestone_review: "bg-orange-100 text-orange-700",
  dispute_resolution: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-slate-100 text-slate-500",
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Bounties</h1>
          <p className="text-sm text-slate-500">Manage your research bounties</p>
        </div>
        <CreateBountyModal />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active", value: counts.active },
          { label: "Drafts", value: counts.drafts },
          { label: "Completed", value: counts.completed, color: "text-emerald-600" },
          { label: "Disputes", value: counts.disputes, color: "text-red-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border-slate-200">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-semibold ${stat.color || "text-slate-900 dark:text-white"}`}>
                {stat.value}
              </p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search bounties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px] border-slate-200">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
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
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <p className="text-slate-500">Unable to load bounties</p>
            <p className="text-xs text-slate-400 mt-1">Please configure Supabase environment variables</p>
          </CardContent>
        </Card>
      ) : bounties.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <FlaskConical className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">
              {search ? "No bounties match your search" : "No bounties yet"}
            </p>
            <p className="text-sm text-slate-400 mt-1 mb-4">
              {search ? "Try different keywords" : "Create your first research bounty to get started"}
            </p>
            {!search && (
              <CreateBountyModal 
                trigger={
                  <Button className="bg-slate-900 hover:bg-slate-800">
                    <Plus className="w-4 h-4 mr-1" /> Create Bounty
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {bounties.map((bounty) => (
            <Link key={bounty.id} href={`/dashboard/bounties/${bounty.id}`}>
              <Card className="border-slate-200 hover:border-slate-300 transition-colors group cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 dark:text-white truncate group-hover:text-amber-600 transition-colors">
                      {bounty.title}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(bounty.total_budget || 0, bounty.currency || "USD")}
                      {bounty.selected_lab && (
                        <span className="ml-2">• {bounty.selected_lab.name}</span>
                      )}
                    </p>
                  </div>
                  <Badge className={stateColors[bounty.current_state] || stateColors.drafting}>
                    {stateLabels[bounty.current_state] || bounty.current_state}
                  </Badge>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination info */}
      {pagination.total > 0 && (
        <p className="text-xs text-center text-slate-400">
          Showing {bounties.length} of {pagination.total} bounties
        </p>
      )}
    </div>
  )
}
