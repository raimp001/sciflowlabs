"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Wallet,
  Calendar,
  FileText
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Bounty {
  id: string
  title: string
  description: string
  methodology: string
  total_budget: number
  currency: string
  state: string
  visibility: string
  min_lab_tier: string
  tags: string[]
  created_at: string
  funder: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    wallet_address_evm: string | null
  }
  milestones: Array<{
    id: string
    title: string
    description: string
    payout_percentage: number
  }>
}

interface Stats {
  pending_review: number
  seeking_proposals: number
  active_research: number
  disputed: number
  completed: number
  cancelled: number
}

function formatCurrency(amount: number, currency: string) {
  return currency === "USD"
    ? `$${amount.toLocaleString()}`
    : `${amount.toLocaleString()} ${currency}`
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function AdminDashboardPage() {
  const { isAuthenticated, privyReady } = useAuth()
  const router = useRouter()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('drafting')
  const [expandedBounty, setExpandedBounty] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchBounties = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`/api/admin/bounties?state=${filter}`)
      if (!res.ok) {
        if (res.status === 403) {
          setError('Admin access required')
          return
        }
        throw new Error('Failed to fetch bounties')
      }
      const data = await res.json()
      setBounties(data.bounties)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bounties')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (privyReady && isAuthenticated) {
      fetchBounties()
    }
  }, [privyReady, isAuthenticated, filter])

  const handleApprove = async (bountyId: string) => {
    setActionLoading(bountyId)
    try {
      const res = await fetch(`/api/admin/bounties/${bountyId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      })
      if (!res.ok) throw new Error('Failed to approve bounty')
      toast.success('Bounty approved and now open for proposals')
      fetchBounties()
    } catch (err) {
      toast.error('Failed to approve bounty')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (bountyId: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    setActionLoading(bountyId)
    try {
      const res = await fetch(`/api/admin/bounties/${bountyId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectReason })
      })
      if (!res.ok) throw new Error('Failed to reject bounty')
      toast.success('Bounty rejected')
      setRejectReason('')
      setExpandedBounty(null)
      fetchBounties()
    } catch (err) {
      toast.error('Failed to reject bounty')
    } finally {
      setActionLoading(null)
    }
  }

  if (!privyReady) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error === 'Admin access required') {
    return (
      <div className="max-w-5xl mx-auto">
        <Card className="bg-card border-border">
          <CardContent className="p-10 text-center">
            <Shield className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin dashboard.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Review and manage bounties</p>
          </div>
        </div>
        <Button onClick={fetchBounties} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[
            { label: "Pending Review", value: stats.pending_review, icon: Clock, color: "text-amber-400", filter: 'drafting' },
            { label: "Open", value: stats.seeking_proposals, icon: FlaskConical, color: "text-blue-400", filter: 'seeking_proposals' },
            { label: "Active", value: stats.active_research, icon: CheckCircle2, color: "text-emerald-400", filter: 'active_research' },
            { label: "Disputed", value: stats.disputed, icon: AlertTriangle, color: "text-red-400", filter: 'disputed' },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400", filter: 'completed' },
            { label: "Cancelled", value: stats.cancelled, icon: XCircle, color: "text-muted-foreground", filter: 'cancelled' },
          ].map((stat) => (
            <Card
              key={stat.label}
              className={`bg-card border-border cursor-pointer hover:border-accent/30 transition-colors ${filter === stat.filter ? 'border-accent' : ''}`}
              onClick={() => setFilter(stat.filter)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bounties List */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {filter === 'drafting' ? 'Bounties Pending Review' : `${filter.replace('_', ' ')} Bounties`}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-card border-border">
            <CardContent className="p-10 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto text-red-400 mb-4" />
              <p className="text-foreground mb-2">{error}</p>
              <Button onClick={fetchBounties} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
            </CardContent>
          </Card>
        ) : bounties.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-10 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-4" />
              <p className="text-foreground">No bounties in this category</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bounties.map((bounty) => (
              <Card key={bounty.id} className="bg-card border-border">
                <CardContent className="p-0">
                  {/* Bounty Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setExpandedBounty(expandedBounty === bounty.id ? null : bounty.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground truncate">{bounty.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {bounty.visibility}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5" />
                            {formatCurrency(bounty.total_budget, bounty.currency)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {bounty.funder?.full_name || bounty.funder?.email || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(bounty.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {filter === 'drafting' && (
                          <>
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleApprove(bounty.id) }}
                              disabled={actionLoading === bounty.id}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedBounty(bounty.id)
                              }}
                              disabled={actionLoading === bounty.id}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {expandedBounty === bounty.id ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedBounty === bounty.id && (
                    <div className="border-t border-border p-4 space-y-4 bg-secondary/20">
                      {/* Description */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-1">
                          <FileText className="w-4 h-4" /> Description
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {bounty.description}
                        </p>
                      </div>

                      {/* Methodology */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">Methodology</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {bounty.methodology}
                        </p>
                      </div>

                      {/* Milestones */}
                      {bounty.milestones && bounty.milestones.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2">
                            Milestones ({bounty.milestones.length})
                          </h4>
                          <div className="space-y-2">
                            {bounty.milestones.map((milestone, idx) => (
                              <div key={milestone.id} className="bg-card p-3 rounded-lg border border-border">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-foreground">
                                    {idx + 1}. {milestone.title}
                                  </span>
                                  <Badge variant="outline">{milestone.payout_percentage}%</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{milestone.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Funder Info */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">Funder Details</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Email: {bounty.funder?.email}</p>
                          {bounty.funder?.wallet_address_evm && (
                            <p className="font-mono text-xs">
                              Wallet: {bounty.funder.wallet_address_evm.slice(0, 10)}...{bounty.funder.wallet_address_evm.slice(-8)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      {bounty.tags && bounty.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {bounty.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      )}

                      {/* Reject Form */}
                      {filter === 'drafting' && (
                        <div className="border-t border-border pt-4">
                          <h4 className="text-sm font-medium text-foreground mb-2">Rejection Reason</h4>
                          <Textarea
                            placeholder="Please provide a reason for rejection (required)..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="mb-3"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              onClick={() => handleReject(bounty.id)}
                              disabled={actionLoading === bounty.id || !rejectReason.trim()}
                            >
                              {actionLoading === bounty.id ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              Confirm Rejection
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => { setRejectReason(''); setExpandedBounty(null) }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
