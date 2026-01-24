"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Search, 
  Filter,
  FileEdit,
  Lock,
  Users,
  FlaskConical,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  MoreVertical
} from "lucide-react"

// State configuration with icons and colors
const stateConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  drafting: {
    label: "Drafting",
    icon: FileEdit,
    color: "text-slate-600",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  ready_for_funding: {
    label: "Ready for Funding",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  funding_escrow: {
    label: "Funding Escrow",
    icon: Lock,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  bidding: {
    label: "Open for Bids",
    icon: Users,
    color: "text-navy-600",
    bgColor: "bg-navy-100 dark:bg-navy-900/30",
  },
  active_research: {
    label: "Active Research",
    icon: FlaskConical,
    color: "text-sage-600",
    bgColor: "bg-sage-100 dark:bg-sage-900/30",
  },
  milestone_review: {
    label: "Milestone Review",
    icon: ClipboardCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  dispute_resolution: {
    label: "Dispute",
    icon: AlertTriangle,
    color: "text-alert-600",
    bgColor: "bg-alert-100 dark:bg-alert-900/30",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-sage-600",
    bgColor: "bg-sage-100 dark:bg-sage-900/30",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
}

// Mock bounties data
const allBounties = [
  {
    id: "bounty_001",
    title: "Novel Protein Folding Analysis for Alzheimer's Biomarkers",
    state: "active_research",
    totalBudget: 125000,
    currency: "USDC",
    paymentMethod: "solana_usdc",
    lab: { name: "Stanford Neuroscience Lab", tier: "institutional" },
    currentMilestone: 2,
    totalMilestones: 4,
    createdAt: "2025-12-15",
    dueDate: "2026-06-15",
  },
  {
    id: "bounty_002",
    title: "mRNA Stability Enhancement in High-Temperature Environments",
    state: "milestone_review",
    totalBudget: 85000,
    currency: "USD",
    paymentMethod: "stripe",
    lab: { name: "BioTech Solutions Inc.", tier: "verified" },
    currentMilestone: 3,
    totalMilestones: 5,
    createdAt: "2025-11-28",
    dueDate: "2026-04-28",
  },
  {
    id: "bounty_003",
    title: "CRISPR Gene Therapy Efficacy Study",
    state: "bidding",
    totalBudget: 200000,
    currency: "USDC",
    paymentMethod: "base_usdc",
    proposalCount: 7,
    createdAt: "2026-01-10",
    dueDate: "2026-08-10",
  },
  {
    id: "bounty_004",
    title: "Climate-Resilient Crop Genome Sequencing",
    state: "drafting",
    totalBudget: 50000,
    currency: "USD",
    createdAt: "2026-01-22",
  },
  {
    id: "bounty_005",
    title: "Microplastic Detection in Marine Ecosystems",
    state: "completed",
    totalBudget: 75000,
    currency: "USDC",
    paymentMethod: "solana_usdc",
    lab: { name: "Ocean Research Institute", tier: "trusted" },
    completedAt: "2025-12-20",
    createdAt: "2025-06-01",
  },
  {
    id: "bounty_006",
    title: "Quantum Computing Applications for Drug Discovery",
    state: "funding_escrow",
    totalBudget: 300000,
    currency: "USDC",
    paymentMethod: "base_usdc",
    createdAt: "2026-01-18",
  },
  {
    id: "bounty_007",
    title: "Neural Interface Safety Protocol Development",
    state: "dispute_resolution",
    totalBudget: 180000,
    currency: "USD",
    paymentMethod: "stripe",
    lab: { name: "NeuroTech Labs", tier: "verified" },
    disputeReason: "timeline_breach",
    createdAt: "2025-08-15",
  },
]

function BountyRow({ bounty }: { bounty: typeof allBounties[0] }) {
  const state = stateConfig[bounty.state]
  const Icon = state.icon

  return (
    <div className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 hover:shadow-clause-md">
      {/* State Icon */}
      <div className={`p-3 rounded-xl ${state.bgColor}`}>
        <Icon className={`w-5 h-5 ${state.color}`} />
      </div>

      {/* Title & Meta */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-navy-800 dark:text-white truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
          {bounty.title}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span>Created {new Date(bounty.createdAt).toLocaleDateString()}</span>
          {bounty.lab && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{bounty.lab.name}</span>
            </>
          )}
          {bounty.proposalCount !== undefined && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{bounty.proposalCount} proposals</span>
            </>
          )}
        </div>
      </div>

      {/* Budget */}
      <div className="text-right">
        <p className="font-mono font-semibold text-navy-800 dark:text-white">
          {bounty.currency === "USD" ? "$" : ""}{bounty.totalBudget.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">{bounty.currency}</p>
      </div>

      {/* State Badge */}
      <Badge variant="outline" className={`${state.bgColor} ${state.color} border-0 whitespace-nowrap`}>
        {state.label}
      </Badge>

      {/* Progress (if applicable) */}
      {bounty.currentMilestone !== undefined && (
        <div className="w-24">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{Math.round((bounty.currentMilestone / bounty.totalMilestones) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-sage-500 rounded-full"
              style={{ width: `${(bounty.currentMilestone / bounty.totalMilestones) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

export default function BountiesPage() {
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  const filteredBounties = allBounties.filter(bounty => {
    if (filter !== "all" && bounty.state !== filter) return false
    if (search && !bounty.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const activeCount = allBounties.filter(b => ["active_research", "milestone_review", "bidding", "funding_escrow"].includes(b.state)).length
  const draftCount = allBounties.filter(b => b.state === "drafting").length
  const completedCount = allBounties.filter(b => b.state === "completed").length
  const disputeCount = allBounties.filter(b => b.state === "dispute_resolution").length

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-800 dark:text-white">My Bounties</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your research bounties
          </p>
        </div>
        <Button className="bg-navy-800 hover:bg-navy-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Bounty
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-clause">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-navy-800 dark:text-white">{activeCount}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-clause">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-navy-800 dark:text-white">{draftCount}</p>
            <p className="text-sm text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-clause">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-sage-600">{completedCount}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-clause">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-alert-600">{disputeCount}</p>
            <p className="text-sm text-muted-foreground">In Dispute</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search bounties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="drafting">Drafting</SelectItem>
            <SelectItem value="funding_escrow">Funding Escrow</SelectItem>
            <SelectItem value="bidding">Open for Bids</SelectItem>
            <SelectItem value="active_research">Active Research</SelectItem>
            <SelectItem value="milestone_review">Milestone Review</SelectItem>
            <SelectItem value="dispute_resolution">Dispute</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bounty List */}
      <div className="space-y-3">
        {filteredBounties.length === 0 ? (
          <Card className="border-0 shadow-clause">
            <CardContent className="p-12 text-center">
              <FileEdit className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-navy-800 dark:text-white mb-2">
                No bounties found
              </h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Try adjusting your search terms" : "Create your first research bounty to get started"}
              </p>
              <Button className="bg-amber-500 hover:bg-amber-400 text-navy-900">
                <Plus className="w-4 h-4 mr-2" />
                Create Bounty
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredBounties.map((bounty, index) => (
            <div 
              key={bounty.id} 
              className="animate-fade-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <BountyRow bounty={bounty} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
