"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3, TrendingUp, DollarSign, Users, FlaskConical } from "lucide-react"
import { useBounties } from "@/hooks/use-bounties"
import { useLabs } from "@/hooks/use-labs"

export default function AnalyticsPage() {
  const { bounties, isLoading: bountiesLoading } = useBounties({})
  const { labs, isLoading: labsLoading } = useLabs({})

  const isLoading = bountiesLoading || labsLoading

  const stats = {
    totalBounties: bounties.length,
    activeBounties: bounties.filter(b => 
      ["active_research", "milestone_review", "bidding"].includes(b.current_state)
    ).length,
    completedBounties: bounties.filter(b => b.current_state === "completed").length,
    totalFunded: bounties.reduce((sum, b) => sum + (b.total_budget || 0), 0),
    totalLabs: labs.length,
    avgReputation: labs.length > 0 
      ? labs.reduce((sum, l) => sum + (l.reputation_score || 0), 0) / labs.length 
      : 0,
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-slate-500" />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500">Platform metrics and insights</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Total Bounties</p>
                  <FlaskConical className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-3xl font-semibold text-slate-900">{stats.totalBounties}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Active</p>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-3xl font-semibold text-emerald-600">{stats.activeBounties}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Completed</p>
                  <span className="text-lg">✓</span>
                </div>
                <p className="text-3xl font-semibold text-slate-900">{stats.completedBounties}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Total Funded</p>
                  <DollarSign className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-3xl font-semibold text-slate-900">${stats.totalFunded.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Labs</p>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-semibold text-slate-900">{stats.totalLabs}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Reputation</p>
                  <span className="text-amber-500">★</span>
                </div>
                <p className="text-3xl font-semibold text-slate-900">{stats.avgReputation.toFixed(1)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Empty state for charts */}
          <Card className="border-slate-200">
            <CardContent className="p-10 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500">Charts will appear as data accumulates</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
