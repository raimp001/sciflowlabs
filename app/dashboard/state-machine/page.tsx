"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  GitBranch,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldX,
  PenLine,
  Clock,
  TimerOff,
  FileEdit,
  FileCheck,
  Wallet,
  Lock,
  Users,
  FlaskConical,
  ClipboardCheck,
  AlertTriangle,
  Scale,
  Split,
  CircleDollarSign,
  Undo2,
  Info,
  Coins,
  Zap,
} from "lucide-react"
import { stateMetadata, type BountyState } from "@/lib/machines/bounty-machine"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileEdit,
  FileCheck,
  Wallet,
  Lock,
  Users,
  FlaskConical,
  ClipboardCheck,
  AlertTriangle,
  Scale,
  Split,
  CircleDollarSign,
  CheckCircle2,
  Undo2,
  XCircle,
  Shield,
  ShieldX,
  PenLine,
  Clock,
  TimerOff,
}

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  slate: { bg: "bg-charcoal-100", border: "border-charcoal-300", text: "text-charcoal-700", glow: "" },
  amber: { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-700", glow: "hover:shadow-amber-glow" },
  coral: { bg: "bg-coral-100", border: "border-coral-300", text: "text-coral-700", glow: "hover:shadow-coral-glow" },
  sage: { bg: "bg-sage-100", border: "border-sage-300", text: "text-sage-700", glow: "hover:shadow-sage-glow" },
  destructive: { bg: "bg-alert-100", border: "border-alert-300", text: "text-alert-700", glow: "" },
  navy: { bg: "bg-charcoal-100", border: "border-charcoal-300", text: "text-charcoal-700", glow: "" },
  pending: { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-700", glow: "hover:shadow-amber-glow" },
}

interface StateNodeProps {
  state: BountyState
  isHighlighted?: boolean
  size?: "sm" | "md" | "lg"
}

function StateNode({ state, isHighlighted, size = "md" }: StateNodeProps) {
  const meta = stateMetadata[state]
  if (!meta) return null

  const Icon = iconMap[meta.icon] || FileEdit
  const colors = colorMap[meta.color] || colorMap.slate

  const sizeClasses = {
    sm: "p-2",
    md: "p-3",
    lg: "p-4",
  }

  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-all cursor-pointer",
        sizeClasses[size],
        colors.bg,
        colors.border,
        colors.glow,
        isHighlighted && "ring-2 ring-coral-500 ring-offset-2 scale-105"
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-lg", colors.bg)}>
          <Icon className={cn("w-4 h-4", colors.text)} />
        </div>
        <div>
          <div className={cn("font-semibold text-sm", colors.text)}>{meta.label}</div>
          {size !== "sm" && (
            <div className="text-xs text-muted-foreground line-clamp-1">{meta.description}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function Arrow({ direction = "right" }: { direction?: "right" | "down" }) {
  return direction === "right" ? (
    <ArrowRight className="w-5 h-5 text-charcoal-400 flex-shrink-0" />
  ) : (
    <ArrowDown className="w-5 h-5 text-charcoal-400 flex-shrink-0 mx-auto" />
  )
}

function BranchLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className={cn("text-xs font-medium uppercase tracking-wide mb-2", color)}>
      {children}
    </div>
  )
}

export default function StateMachinePage() {
  const [selectedState, setSelectedState] = useState<BountyState | null>(null)

  const selectedMeta = selectedState ? stateMetadata[selectedState] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal-900 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-coral-500" />
            Bounty Lifecycle State Machine
          </h1>
          <p className="text-sm text-charcoal-500 mt-1">
            Complete visualization of the research bounty workflow with blockchain-backed escrow
          </p>
        </div>
      </div>

      <Tabs defaultValue="diagram" className="space-y-6">
        <TabsList className="bg-cream-300">
          <TabsTrigger value="diagram">Visual Diagram</TabsTrigger>
          <TabsTrigger value="states">All States</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="diagram" className="space-y-6">
          {/* Main Flow Diagram */}
          <Card className="border-charcoal-200 overflow-hidden">
            <CardHeader className="bg-cream-200 border-b border-charcoal-200">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-coral-500" />
                Main Bounty Flow
              </CardTitle>
              <CardDescription>
                The primary path from bounty creation to completion
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Row 1: Creation & Admin Review */}
              <div className="space-y-4">
                <BranchLabel color="text-charcoal-500">Phase 1: Creation & Approval</BranchLabel>
                <div className="flex items-center gap-3 flex-wrap">
                  <StateNode state="drafting" isHighlighted={selectedState === "drafting"} />
                  <Arrow />
                  <StateNode state="pending_admin_review" isHighlighted={selectedState === "pending_admin_review"} />
                  <Arrow />
                  <StateNode state="ready_for_funding" isHighlighted={selectedState === "ready_for_funding"} />
                </div>

                {/* Admin Review Branches */}
                <div className="ml-[200px] pl-6 border-l-2 border-coral-300 py-3 space-y-2">
                  <BranchLabel color="text-coral-600">Admin Moderation Branches</BranchLabel>
                  <div className="flex items-center gap-3">
                    <StateNode state="requires_changes" size="sm" isHighlighted={selectedState === "requires_changes"} />
                    <span className="text-xs text-charcoal-500">→ Back to Drafting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StateNode state="rejected" size="sm" isHighlighted={selectedState === "rejected"} />
                    <span className="text-xs text-charcoal-500">→ Terminal (Policy Violation)</span>
                  </div>
                </div>

                {/* Row 2: Funding & Bidding */}
                <div className="pt-4">
                  <BranchLabel color="text-charcoal-500">Phase 2: Funding & Lab Selection</BranchLabel>
                  <div className="flex items-center gap-3 flex-wrap">
                    <StateNode state="funding_escrow" isHighlighted={selectedState === "funding_escrow"} />
                    <Arrow />
                    <StateNode state="bidding" isHighlighted={selectedState === "bidding"} />
                    <Arrow />
                    <StateNode state="active_research" isHighlighted={selectedState === "active_research"} />
                  </div>
                </div>

                {/* Deadline Management Branches */}
                <div className="ml-[400px] pl-6 border-l-2 border-amber-300 py-3 space-y-2">
                  <BranchLabel color="text-amber-600">Deadline Management</BranchLabel>
                  <div className="flex items-center gap-3">
                    <StateNode state="extension_review" size="sm" isHighlighted={selectedState === "extension_review"} />
                    <span className="text-xs text-charcoal-500">→ Lab requests more time</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StateNode state="deadline_breach" size="sm" isHighlighted={selectedState === "deadline_breach"} />
                    <span className="text-xs text-charcoal-500">→ Deadline exceeded</span>
                  </div>
                </div>

                {/* Row 3: Milestone & Completion */}
                <div className="pt-4">
                  <BranchLabel color="text-charcoal-500">Phase 3: Milestone Review & Completion</BranchLabel>
                  <div className="flex items-center gap-3 flex-wrap">
                    <StateNode state="milestone_review" isHighlighted={selectedState === "milestone_review"} />
                    <Arrow />
                    <StateNode state="completed_payout" isHighlighted={selectedState === "completed_payout"} />
                    <Arrow />
                    <StateNode state="completed" isHighlighted={selectedState === "completed"} />
                  </div>
                </div>

                {/* Dispute Branches */}
                <div className="ml-[100px] pl-6 border-l-2 border-alert-300 py-3 space-y-2">
                  <BranchLabel color="text-alert-600">Dispute Resolution Path</BranchLabel>
                  <div className="flex items-center gap-3 flex-wrap">
                    <StateNode state="dispute_resolution" size="sm" isHighlighted={selectedState === "dispute_resolution"} />
                    <Arrow />
                    <StateNode state="external_arbitration" size="sm" isHighlighted={selectedState === "external_arbitration"} />
                    <Arrow />
                    <StateNode state="partial_settlement" size="sm" isHighlighted={selectedState === "partial_settlement"} />
                  </div>
                </div>

                {/* Cancellation */}
                <div className="pt-4">
                  <BranchLabel color="text-charcoal-400">Cancellation Path (Available from most states)</BranchLabel>
                  <div className="flex items-center gap-3">
                    <StateNode state="refunding" size="sm" isHighlighted={selectedState === "refunding"} />
                    <Arrow />
                    <StateNode state="cancelled" size="sm" isHighlighted={selectedState === "cancelled"} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="border-charcoal-200">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                State Color Legend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-charcoal-200 border border-charcoal-400" />
                  <span className="text-sm text-charcoal-600">Neutral/Initial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-coral-200 border border-coral-400" />
                  <span className="text-sm text-charcoal-600">Admin Action</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-200 border border-amber-400" />
                  <span className="text-sm text-charcoal-600">Pending/Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-sage-200 border border-sage-400" />
                  <span className="text-sm text-charcoal-600">Success/Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-alert-200 border border-alert-400" />
                  <span className="text-sm text-charcoal-600">Dispute/Alert</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="states" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stateMetadata).map(([state, meta]) => {
              const Icon = iconMap[meta.icon] || FileEdit
              const colors = colorMap[meta.color] || colorMap.slate

              return (
                <Card
                  key={state}
                  className={cn(
                    "border-2 transition-all hover:shadow-soft-md cursor-pointer",
                    colors.border,
                    selectedState === state && "ring-2 ring-coral-500"
                  )}
                  onClick={() => setSelectedState(state as BountyState)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", colors.bg)}>
                        <Icon className={cn("w-5 h-5", colors.text)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={cn("font-semibold", colors.text)}>{meta.label}</h3>
                          {meta.requiresAdmin && (
                            <Badge variant="outline" className="text-xs border-coral-300 text-coral-600">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-charcoal-500 mt-1">{meta.description}</p>
                        {meta.allowedActions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-charcoal-200">
                            <p className="text-xs font-medium text-charcoal-400 mb-1.5">
                              Available Actions:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {meta.allowedActions.map((action) => (
                                <Badge
                                  key={action}
                                  variant="secondary"
                                  className="text-xs bg-cream-300 text-charcoal-600"
                                >
                                  {action.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Solana Integration */}
            <Card className="border-charcoal-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-teal-400">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                  Solana Integration
                </CardTitle>
                <CardDescription>USDC payments via SPL tokens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-500">Token</span>
                    <Badge variant="outline">USDC (SPL)</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-500">Escrow Type</span>
                    <Badge variant="outline">PDA (Program Derived Address)</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-500">Network</span>
                    <Badge className="bg-sage-100 text-sage-700">Mainnet-Beta</Badge>
                  </div>
                </div>
                <div className="pt-3 border-t border-charcoal-200">
                  <p className="text-xs text-charcoal-500">
                    Funds are locked in a Program Derived Address (PDA) during escrow. The smart contract
                    releases funds to the lab upon milestone verification or returns to funder on cancellation.
                  </p>
                </div>
                <div className="p-3 bg-cream-200 rounded-lg">
                  <p className="text-xs font-mono text-charcoal-600">
                    Token: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Base Integration */}
            <Card className="border-charcoal-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-600">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                  Base Integration
                </CardTitle>
                <CardDescription>USDC payments via ERC20 tokens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-500">Token</span>
                    <Badge variant="outline">USDC (ERC20)</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-500">Escrow Type</span>
                    <Badge variant="outline">Smart Contract</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-500">Network</span>
                    <Badge className="bg-blue-100 text-blue-700">Base Mainnet</Badge>
                  </div>
                </div>
                <div className="pt-3 border-t border-charcoal-200">
                  <p className="text-xs text-charcoal-500">
                    An ERC20-compatible smart contract holds funds in escrow. The contract enforces
                    milestone-based releases and handles dispute resolution with stake slashing.
                  </p>
                </div>
                <div className="p-3 bg-cream-200 rounded-lg">
                  <p className="text-xs font-mono text-charcoal-600">
                    Token: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Flow */}
          <Card className="border-charcoal-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-coral-500" />
                Payment Flow Through States
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-cream-200 rounded-lg">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Lock className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Funding Escrow</h4>
                    <p className="text-sm text-charcoal-500">
                      Funder deposits full bounty amount. Funds are locked in blockchain escrow
                      (Solana PDA or Base smart contract).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-cream-200 rounded-lg">
                  <div className="p-2 rounded-lg bg-sage-100">
                    <CheckCircle2 className="w-5 h-5 text-sage-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Milestone Verification</h4>
                    <p className="text-sm text-charcoal-500">
                      As each milestone is approved, the corresponding percentage of funds is released
                      to the lab's wallet automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-cream-200 rounded-lg">
                  <div className="p-2 rounded-lg bg-alert-100">
                    <AlertTriangle className="w-5 h-5 text-alert-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Dispute & Stake Slashing</h4>
                    <p className="text-sm text-charcoal-500">
                      If a dispute occurs, funds are frozen. Resolution may result in stake slashing
                      (lab loses staked tokens) or partial refund to funder.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-cream-200 rounded-lg">
                  <div className="p-2 rounded-lg bg-charcoal-100">
                    <Undo2 className="w-5 h-5 text-charcoal-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Refund on Cancellation</h4>
                    <p className="text-sm text-charcoal-500">
                      If bounty is cancelled before completion, remaining escrowed funds are returned
                      to the funder's wallet.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
