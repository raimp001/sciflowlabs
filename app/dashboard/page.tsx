"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FileEdit, 
  Lock, 
  Users, 
  FlaskConical, 
  ClipboardCheck, 
  AlertTriangle, 
  CircleDollarSign,
  CheckCircle2,
  ArrowRight,
  Plus,
  TrendingUp,
  Wallet,
  Shield
} from "lucide-react"

// State metadata for visualization
const stateConfig = {
  drafting: {
    label: "Drafting",
    description: "Define research protocols",
    icon: FileEdit,
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dotColor: "bg-slate-400",
  },
  funding_escrow: {
    label: "Funding Escrow",
    description: "Funds being secured",
    icon: Lock,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
  },
  bidding: {
    label: "Open for Bids",
    description: "Labs submitting proposals",
    icon: Users,
    color: "bg-navy-50 text-navy-700 border-navy-200",
    dotColor: "bg-navy-500",
  },
  active_research: {
    label: "Active Research",
    description: "Lab conducting research",
    icon: FlaskConical,
    color: "bg-sage-50 text-sage-700 border-sage-200",
    dotColor: "bg-sage-500",
  },
  milestone_review: {
    label: "Milestone Review",
    description: "Verifying deliverables",
    icon: ClipboardCheck,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
  },
  dispute_resolution: {
    label: "Dispute",
    description: "Investigating issue",
    icon: AlertTriangle,
    color: "bg-alert-50 text-alert-700 border-alert-200",
    dotColor: "bg-alert-500",
  },
  completed: {
    label: "Completed",
    description: "Funds released",
    icon: CheckCircle2,
    color: "bg-sage-50 text-sage-700 border-sage-200",
    dotColor: "bg-sage-500",
  },
}

// Mock bounty data
const mockBounties = [
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
  },
  {
    id: "bounty_003",
    title: "CRISPR Gene Therapy Efficacy Study",
    state: "bidding",
    totalBudget: 200000,
    currency: "USDC",
    paymentMethod: "base_usdc",
    proposals: 7,
    createdAt: "2026-01-10",
  },
  {
    id: "bounty_004",
    title: "Climate-Resilient Crop Genome Sequencing",
    state: "drafting",
    totalBudget: 50000,
    currency: "USD",
    createdAt: "2026-01-22",
  },
]

// Stats cards
const stats = [
  { label: "Active Bounties", value: "12", change: "+3 this month", icon: FlaskConical, color: "text-sage-600" },
  { label: "Total Escrowed", value: "$2.4M", change: "$850K in USDC", icon: Wallet, color: "text-amber-600" },
  { label: "Labs Engaged", value: "48", change: "94% completion rate", icon: Users, color: "text-navy-600" },
  { label: "Disputes", value: "2", change: "Both in resolution", icon: Shield, color: "text-alert-600" },
]

function StateFlowVisualization() {
  const states = ["drafting", "funding_escrow", "bidding", "active_research", "milestone_review", "completed"]
  const activeIndex = 3 // active_research for demo

  return (
    <Card className="border-0 shadow-clause-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-navy-800">Bounty Lifecycle</CardTitle>
        <CardDescription>State machine progression for research bounties</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
          {states.map((stateKey, index) => {
            const state = stateConfig[stateKey as keyof typeof stateConfig]
            const Icon = state.icon
            const isActive = index === activeIndex
            const isCompleted = index < activeIndex
            
            return (
              <div key={stateKey} className="flex items-center">
                <div 
                  className={`
                    relative flex flex-col items-center p-3 rounded-lg border-2 min-w-[100px] transition-all duration-300
                    ${isActive ? 'border-amber-500 bg-amber-50 shadow-amber-glow scale-105' : ''}
                    ${isCompleted ? 'border-sage-500 bg-sage-50' : ''}
                    ${!isActive && !isCompleted ? 'border-slate-200 bg-white' : ''}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${isActive ? 'bg-amber-500 text-white' : ''}
                    ${isCompleted ? 'bg-sage-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-slate-100 text-slate-400' : ''}
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center ${isActive ? 'text-amber-700' : isCompleted ? 'text-sage-700' : 'text-slate-500'}`}>
                    {state.label}
                  </span>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                  )}
                </div>
                {index < states.length - 1 && (
                  <ArrowRight className={`w-5 h-5 mx-1 flex-shrink-0 ${index < activeIndex ? 'text-sage-400' : 'text-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function BountyCard({ bounty }: { bounty: typeof mockBounties[0] }) {
  const state = stateConfig[bounty.state as keyof typeof stateConfig]
  const Icon = state.icon

  return (
    <Card className="border-0 shadow-clause card-interactive">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-navy-800 dark:text-white line-clamp-2 mb-1">
              {bounty.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              Created {new Date(bounty.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={`${state.color} border flex items-center gap-1.5 whitespace-nowrap`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${state.dotColor}`} />
            {state.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-navy-800 dark:text-white font-mono">
              {bounty.currency === "USD" ? "$" : ""}{bounty.totalBudget.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">{bounty.currency}</span>
            </p>
            {bounty.paymentMethod && (
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                via {bounty.paymentMethod.replace("_", " ")}
              </p>
            )}
          </div>

          {bounty.lab && (
            <div className="text-right">
              <p className="text-sm font-medium text-navy-700 dark:text-slate-300">{bounty.lab.name}</p>
              <Badge variant="secondary" className="text-xs capitalize">
                {bounty.lab.tier}
              </Badge>
            </div>
          )}

          {bounty.proposals !== undefined && (
            <div className="text-right">
              <p className="text-2xl font-bold text-navy-800 dark:text-white">{bounty.proposals}</p>
              <p className="text-xs text-muted-foreground">proposals</p>
            </div>
          )}
        </div>

        {bounty.currentMilestone !== undefined && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Milestone Progress</span>
              <span className="font-medium text-navy-700 dark:text-slate-300">
                {bounty.currentMilestone} of {bounty.totalMilestones}
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-sage-500 to-sage-400 rounded-full transition-all duration-500"
                style={{ width: `${(bounty.currentMilestone / bounty.totalMilestones) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-800 dark:text-white">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your research bounties and track progress
          </p>
        </div>
        <Button className="bg-navy-800 hover:bg-navy-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Bounty
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card 
              key={stat.label} 
              className="border-0 shadow-clause-md animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-navy-800 dark:text-white mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-sage-500" />
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* State Machine Visualization */}
      <StateFlowVisualization />

      {/* Active Bounties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-navy-800 dark:text-white">Your Bounties</h2>
          <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockBounties.map((bounty, index) => (
            <div 
              key={bounty.id} 
              className="animate-fade-up"
              style={{ animationDelay: `${(index + 4) * 100}ms` }}
            >
              <BountyCard bounty={bounty} />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-clause-md bg-gradient-to-r from-navy-800 to-navy-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <h3 className="text-xl font-semibold mb-1">Ready to fund breakthrough research?</h3>
              <p className="text-navy-200">
                Create a bounty and connect with verified labs worldwide
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Browse Labs
              </Button>
              <Button className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold">
                Create Bounty
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
