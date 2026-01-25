"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Plus, 
  ArrowRight,
  FlaskConical,
  Wallet,
  Users,
  AlertTriangle
} from "lucide-react"
import { CreateBountyModal } from "@/components/create-bounty-modal"
import { useBounties } from "@/hooks/use-bounties"
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

export default function DashboardPage() {
  const { bounties, isLoading, error } = useBounties({ limit: 6 })

  const stats = {
    active: bounties.filter(b => 
      ["active_research", "milestone_review", "bidding", "funding_escrow"].includes(b.current_state)
    ).length,
    total: bounties.reduce((sum, b) => sum + (b.total_budget || 0), 0),
    labs: new Set(bounties.filter(b => b.selected_lab_id).map(b => b.selected_lab_id)).size,
    disputes: bounties.filter(b => b.current_state === "dispute_resolution").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your research bounties</p>
        </div>
        <CreateBountyModal />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active", value: stats.active, icon: FlaskConical, color: "text-emerald-600" },
          { label: "Total Value", value: formatCurrency(stats.total, "USD"), icon: Wallet, color: "text-amber-600" },
          { label: "Labs", value: stats.labs, icon: Users, color: "text-blue-600" },
          { label: "Disputes", value: stats.disputes, icon: AlertTriangle, color: "text-red-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border-slate-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bounties */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">Recent Bounties</h2>
          <Link href="/dashboard/bounties">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-slate-200">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center">
              <p className="text-slate-500">Unable to load bounties</p>
              <p className="text-xs text-slate-400 mt-1">Connect Supabase to get started</p>
            </CardContent>
          </Card>
        ) : bounties.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center">
              <FlaskConical className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">No bounties yet</p>
              <p className="text-sm text-slate-400 mb-4">Create your first research bounty</p>
              <CreateBountyModal 
                trigger={
                  <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                    <Plus className="w-4 h-4 mr-1" /> Create Bounty
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {bounties.map((bounty) => (
              <Link key={bounty.id} href={`/dashboard/bounties/${bounty.id}`}>
                <Card className="border-slate-200 hover:border-slate-300 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-slate-900 dark:text-white truncate">
                        {bounty.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {formatCurrency(bounty.total_budget || 0, bounty.currency || "USD")}
                      </p>
                    </div>
                    <Badge className={stateColors[bounty.current_state] || stateColors.drafting}>
                      {stateLabels[bounty.current_state] || bounty.current_state}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action */}
      <Card className="bg-slate-900 border-0">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-white">Ready to fund research?</p>
            <p className="text-sm text-slate-400">Create a bounty and connect with verified labs</p>
          </div>
          <CreateBountyModal 
            trigger={
              <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium">
                Create Bounty
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
