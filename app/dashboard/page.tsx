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
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { CreateBountyModal } from "@/components/create-bounty-modal"
import { useBounties } from "@/hooks/use-bounties"
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

export default function DashboardPage() {
  const { bounties, isLoading, error, refresh } = useBounties({ limit: 6 })

  const stats = {
    active: bounties.filter(b => 
      ["active_research", "milestone_review", "bidding", "funding_escrow"].includes(b.current_state)
    ).length,
    total: bounties.reduce((sum, b) => sum + (b.total_budget || 0), 0),
    labs: new Set(bounties.filter(b => b.selected_lab_id).map(b => b.selected_lab_id)).size,
    disputes: bounties.filter(b => b.current_state === "dispute_resolution").length,
  }

  const hasError = error !== null
  const isEmpty = !isLoading && !hasError && bounties.length === 0

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your research bounties</p>
        </div>
        <CreateBountyModal />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {[
          { label: "Active", value: stats.active, icon: FlaskConical, color: "text-emerald-400" },
          { label: "Total Value", value: formatCurrency(stats.total, "USD"), icon: Wallet, color: "text-accent" },
          { label: "Labs", value: stats.labs, icon: Users, color: "text-blue-400" },
          { label: "Disputes", value: stats.disputes, icon: AlertTriangle, color: "text-red-400" },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="bg-card border-border"
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{stat.value}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-secondary/50 flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bounties */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">Recent Bounties</h2>
          <Link href="/dashboard/bounties">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border-border rounded-xl">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2 bg-secondary" />
                  <Skeleton className="h-4 w-1/4 bg-secondary" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hasError ? (
          <Card className="bg-card border-border rounded-xl">
            <CardContent className="p-10 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium text-foreground mb-2">Unable to load bounties</p>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Please check your connection or try again later.
              </p>
              <Button 
                variant="outline" 
                onClick={() => refresh()}
                className="border-border text-foreground hover:bg-secondary rounded-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
            </CardContent>
          </Card>
        ) : isEmpty ? (
          <Card className="bg-card border-border rounded-xl">
            <CardContent className="p-10 text-center">
              <FlaskConical className="w-10 h-10 mx-auto text-accent mb-4" />
              <p className="font-semibold text-foreground mb-2">No bounties yet</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first research bounty to get started.
              </p>
              <CreateBountyModal 
                trigger={
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                    <Plus className="w-4 h-4 mr-2" /> Create Bounty
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {bounties.map((bounty) => (
              <Link key={bounty.id} href={`/dashboard/bounties/${bounty.id}`}>
                <Card 
                  className="bg-card border-border hover:border-accent/30 transition-colors cursor-pointer rounded-xl"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground truncate">
                        {bounty.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(bounty.total_budget || 0, bounty.currency || "USD")}
                      </p>
                    </div>
                    <Badge className={`${stateColors[bounty.current_state] || stateColors.drafting} border-0`}>
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
      <Card className="bg-accent/10 border-accent/20 overflow-hidden">
        <CardContent className="p-6 md:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground text-base">Ready to fund research?</p>
            <p className="text-sm text-muted-foreground mt-1">Create a bounty and connect with verified labs</p>
          </div>
          <CreateBountyModal
            trigger={
              <Button className="font-semibold px-6 h-11 shadow-md hover:shadow-lg">
                Create Bounty
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
