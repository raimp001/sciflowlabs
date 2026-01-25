"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Shield,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  PenLine,
  Clock,
  AlertOctagon,
  Filter,
} from "lucide-react"
import { useBounties } from "@/hooks/use-bounties"
import {
  analyzeContent,
  type RejectionReason,
  type ContentFlags,
  type RiskLevel,
} from "@/lib/machines/bounty-machine"

const riskLevelColors: Record<RiskLevel, string> = {
  low: "bg-sage-100 text-sage-700 border-sage-300",
  medium: "bg-amber-100 text-amber-700 border-amber-300",
  high: "bg-coral-100 text-coral-700 border-coral-300",
  critical: "bg-alert-100 text-alert-700 border-alert-300",
}

const riskLevelLabels: Record<RiskLevel, string> = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
  critical: "Critical Risk",
}

const rejectionReasons: { value: RejectionReason; label: string }[] = [
  { value: "dangerous_research", label: "Dangerous Research" },
  { value: "unethical_content", label: "Unethical Content" },
  { value: "illegal_activity", label: "Illegal Activity" },
  { value: "insufficient_detail", label: "Insufficient Detail" },
  { value: "unrealistic_budget", label: "Unrealistic Budget" },
  { value: "spam_or_fraud", label: "Spam or Fraud" },
  { value: "duplicate_bounty", label: "Duplicate Bounty" },
  { value: "other", label: "Other" },
]

interface PendingBounty {
  id: string
  title: string
  description: string
  methodology: string
  funder_name: string
  total_budget: number
  currency: string
  submitted_at: string
  contentFlags: ContentFlags
}

// Mock data for demonstration
const mockPendingBounties: PendingBounty[] = [
  {
    id: "1",
    title: "Novel Drug Delivery Mechanism Study",
    description: "Research into targeted nanoparticle drug delivery for cancer treatment using biodegradable polymers.",
    methodology: "In vitro cell culture studies followed by animal model validation with proper ethics approval.",
    funder_name: "BioTech Research Inc.",
    total_budget: 75000,
    currency: "USDC",
    submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    contentFlags: {
      hasDangerousKeywords: false,
      hasEthicalConcerns: false,
      hasUnrealisticExpectations: false,
      riskLevel: "low",
      flaggedTerms: [],
    },
  },
  {
    id: "2",
    title: "Gain of Function Virus Research",
    description: "Study to enhance viral transmissibility for vaccine development purposes.",
    methodology: "Laboratory manipulation of viral strains without proper biosafety protocols.",
    funder_name: "Anonymous Researcher",
    total_budget: 500000,
    currency: "USDC",
    submitted_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    contentFlags: {
      hasDangerousKeywords: true,
      hasEthicalConcerns: true,
      hasUnrealisticExpectations: false,
      riskLevel: "critical",
      flaggedTerms: ["gain of function", "engineered virus"],
    },
  },
  {
    id: "3",
    title: "Miracle Cancer Cure Discovery",
    description: "100% guaranteed cure for all types of cancer using secret natural compounds.",
    methodology: "Proprietary extraction method that will cure any cancer overnight.",
    funder_name: "Wonder Labs LLC",
    total_budget: 10000,
    currency: "USD",
    submitted_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    contentFlags: {
      hasDangerousKeywords: false,
      hasEthicalConcerns: false,
      hasUnrealisticExpectations: true,
      riskLevel: "medium",
      flaggedTerms: ["unrealistic claims"],
    },
  },
]

export default function AdminReviewPage() {
  const [filter, setFilter] = useState<RiskLevel | "all">("all")
  const [search, setSearch] = useState("")
  const [selectedBounty, setSelectedBounty] = useState<PendingBounty | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "changes">("approve")
  const [rejectionReason, setRejectionReason] = useState<RejectionReason>("other")
  const [reviewNotes, setReviewNotes] = useState("")
  const [requiredChanges, setRequiredChanges] = useState("")

  // Filter bounties
  const filteredBounties = mockPendingBounties.filter((bounty) => {
    const matchesSearch =
      search === "" ||
      bounty.title.toLowerCase().includes(search.toLowerCase()) ||
      bounty.funder_name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || bounty.contentFlags.riskLevel === filter
    return matchesSearch && matchesFilter
  })

  const counts = {
    total: mockPendingBounties.length,
    critical: mockPendingBounties.filter((b) => b.contentFlags.riskLevel === "critical").length,
    high: mockPendingBounties.filter((b) => b.contentFlags.riskLevel === "high").length,
    medium: mockPendingBounties.filter((b) => b.contentFlags.riskLevel === "medium").length,
    low: mockPendingBounties.filter((b) => b.contentFlags.riskLevel === "low").length,
  }

  const handleReview = (bounty: PendingBounty, action: "approve" | "reject" | "changes") => {
    setSelectedBounty(bounty)
    setReviewAction(action)
    setReviewNotes("")
    setRequiredChanges("")
    setReviewDialogOpen(true)
  }

  const submitReview = () => {
    // In production, this would call the state machine transition
    console.log("Review submitted:", {
      bountyId: selectedBounty?.id,
      action: reviewAction,
      notes: reviewNotes,
      rejectionReason: reviewAction === "reject" ? rejectionReason : undefined,
      requiredChanges: reviewAction === "changes" ? requiredChanges.split("\n") : undefined,
    })
    setReviewDialogOpen(false)
    setSelectedBounty(null)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours < 1) return "Just now"
    if (diffHours === 1) return "1 hour ago"
    if (diffHours < 24) return `${diffHours} hours ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-coral-500" />
            Admin Review Queue
          </h1>
          <p className="text-sm text-charcoal-500 mt-1">
            Review and moderate bounty submissions for safety and legitimacy
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="border-charcoal-200">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto text-charcoal-400 mb-1" />
            <p className="text-2xl font-semibold text-charcoal-900">{counts.total}</p>
            <p className="text-xs text-charcoal-500">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-alert-200 bg-alert-50">
          <CardContent className="p-4 text-center">
            <AlertOctagon className="w-5 h-5 mx-auto text-alert-500 mb-1" />
            <p className="text-2xl font-semibold text-alert-700">{counts.critical}</p>
            <p className="text-xs text-alert-600">Critical</p>
          </CardContent>
        </Card>
        <Card className="border-coral-200 bg-coral-50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto text-coral-500 mb-1" />
            <p className="text-2xl font-semibold text-coral-700">{counts.high}</p>
            <p className="text-xs text-coral-600">High Risk</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-semibold text-amber-700">{counts.medium}</p>
            <p className="text-xs text-amber-600">Medium</p>
          </CardContent>
        </Card>
        <Card className="border-sage-200 bg-sage-50">
          <CardContent className="p-4 text-center">
            <ShieldCheck className="w-5 h-5 mx-auto text-sage-500 mb-1" />
            <p className="text-2xl font-semibold text-sage-700">{counts.low}</p>
            <p className="text-xs text-sage-600">Low Risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <Input
            placeholder="Search by title or funder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-charcoal-200"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as RiskLevel | "all")}>
          <SelectTrigger className="w-[180px] border-charcoal-200">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="critical">Critical Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bounty List */}
      <div className="space-y-3">
        {filteredBounties.length === 0 ? (
          <Card className="border-charcoal-200">
            <CardContent className="p-10 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-sage-300 mb-3" />
              <p className="font-medium text-charcoal-700">No pending reviews</p>
              <p className="text-sm text-charcoal-400 mt-1">
                All submissions have been reviewed
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBounties.map((bounty) => (
            <Card
              key={bounty.id}
              className={`border-2 transition-all hover:shadow-soft-md ${
                bounty.contentFlags.riskLevel === "critical"
                  ? "border-alert-300 bg-alert-50/50"
                  : bounty.contentFlags.riskLevel === "high"
                  ? "border-coral-300 bg-coral-50/50"
                  : bounty.contentFlags.riskLevel === "medium"
                  ? "border-amber-300 bg-amber-50/50"
                  : "border-charcoal-200"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-charcoal-900 truncate">
                        {bounty.title}
                      </h3>
                      <Badge
                        className={`${riskLevelColors[bounty.contentFlags.riskLevel]} border`}
                      >
                        {riskLevelLabels[bounty.contentFlags.riskLevel]}
                      </Badge>
                    </div>
                    <p className="text-sm text-charcoal-600 line-clamp-2 mb-3">
                      {bounty.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-charcoal-500">
                      <span>By: {bounty.funder_name}</span>
                      <span>•</span>
                      <span>
                        Budget: {bounty.total_budget.toLocaleString()} {bounty.currency}
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(bounty.submitted_at)}</span>
                    </div>

                    {/* Flagged Terms */}
                    {bounty.contentFlags.flaggedTerms.length > 0 && (
                      <div className="mt-3 p-3 bg-alert-100 rounded-lg border border-alert-200">
                        <div className="flex items-center gap-2 text-alert-700 text-sm font-medium mb-1">
                          <AlertTriangle className="w-4 h-4" />
                          Flagged Content
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {bounty.contentFlags.flaggedTerms.map((term, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="bg-white border-alert-300 text-alert-700 text-xs"
                            >
                              {term}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-charcoal-300"
                      onClick={() => handleReview(bounty, "approve")}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                    <Button
                      size="sm"
                      className="bg-sage-500 hover:bg-sage-600 text-white"
                      onClick={() => handleReview(bounty, "approve")}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => handleReview(bounty, "changes")}
                    >
                      <PenLine className="w-4 h-4 mr-1" />
                      Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-alert-300 text-alert-700 hover:bg-alert-50"
                      onClick={() => handleReview(bounty, "reject")}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === "approve" && (
                <>
                  <ShieldCheck className="w-5 h-5 text-sage-500" />
                  Approve Bounty
                </>
              )}
              {reviewAction === "reject" && (
                <>
                  <ShieldX className="w-5 h-5 text-alert-500" />
                  Reject Bounty
                </>
              )}
              {reviewAction === "changes" && (
                <>
                  <PenLine className="w-5 h-5 text-amber-500" />
                  Request Changes
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedBounty?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {reviewAction === "reject" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-charcoal-700">
                  Rejection Reason
                </label>
                <Select
                  value={rejectionReason}
                  onValueChange={(v) => setRejectionReason(v as RejectionReason)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rejectionReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reviewAction === "changes" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-charcoal-700">
                  Required Changes (one per line)
                </label>
                <Textarea
                  placeholder="e.g., Add ethics approval documentation&#10;Clarify methodology details&#10;Provide realistic timeline"
                  value={requiredChanges}
                  onChange={(e) => setRequiredChanges(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal-700">
                Admin Notes {reviewAction !== "approve" && "(visible to funder)"}
              </label>
              <Textarea
                placeholder={
                  reviewAction === "approve"
                    ? "Optional notes for internal records..."
                    : "Explain your decision to the funder..."
                }
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              className={
                reviewAction === "approve"
                  ? "bg-sage-500 hover:bg-sage-600"
                  : reviewAction === "reject"
                  ? "bg-alert-500 hover:bg-alert-600"
                  : "bg-amber-500 hover:bg-amber-600"
              }
            >
              {reviewAction === "approve" && "Approve Bounty"}
              {reviewAction === "reject" && "Reject Bounty"}
              {reviewAction === "changes" && "Request Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
