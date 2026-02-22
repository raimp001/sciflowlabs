"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertTriangle, Shield, Clock } from "lucide-react"
import { toast } from "sonner"

interface Bounty {
  id: string
  title: string
  description: string
  methodology: string
  total_budget: number
  currency: string
  created_at: string
  state_history: Array<{
    state: string
    timestamp: string
    review?: { decision: string; score: number; signals: Array<{ type: string; severity: string; message: string }> }
  }>
  funder: { email: string; full_name: string | null; wallet_address_evm: string | null }
  milestones: Array<{ title: string; payout_percentage: number }>
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{score}</span>
    </div>
  )
}

export default function AdminPage() {
  const { isAuthenticated, dbUser, isLoading } = useAuth()
  const router = useRouter()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [verifyRequests, setVerifyRequests] = useState<Array<{ id: string; data: Record<string, unknown>; created_at: string }>>([])
  const [fetching, setFetching] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [selected, setSelected] = useState<Bounty | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const fetchBounties = useCallback(async () => {
    setFetching(true)
    try {
      const [bRes, nRes] = await Promise.all([
        fetch('/api/admin/bounties'),
        fetch('/api/notifications?unread=true'),
      ])
      if (bRes.ok) {
        const { bounties } = await bRes.json()
        setBounties(bounties || [])
      }
      if (nRes.ok) {
        const { notifications } = await nRes.json()
        setVerifyRequests((notifications || []).filter((n: { data?: { type?: string } }) => n.data?.type === 'lab_verification_request'))
      }
    } catch {
      toast.error('Could not load review queue')
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.replace('/login'); return }
    if (!isLoading && dbUser && dbUser.role !== 'admin') { router.replace('/dashboard'); return }
    if (dbUser?.role === 'admin') fetchBounties()
  }, [isLoading, isAuthenticated, dbUser, router, fetchBounties])

  const act = async (bountyId: string, action: 'approve' | 'reject', reason?: string) => {
    setActing(bountyId)
    try {
      const res = await fetch('/api/admin/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bountyId, action, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(action === 'approve' ? 'Bounty approved — now live for funding' : 'Bounty sent back to funder')
      setBounties(b => b.filter(x => x.id !== bountyId))
      setSelected(null)
      setRejectReason("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActing(null)
    }
  }

  if (isLoading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (dbUser?.role !== 'admin') return null

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <h1 className="text-xl font-medium text-foreground">Admin Review Queue</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            All new bounties pass through here before labs can see them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bounties.length > 0 && (
            <Badge className="bg-amber-500/15 text-amber-400 border-0">
              {bounties.length} pending
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchBounties} className="rounded-full">
            Refresh
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {bounties.length === 0 && (
        <div className="py-16 text-center border border-border/40 rounded-xl border-dashed">
          <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-3" />
          <p className="font-medium text-foreground">Queue is clear</p>
          <p className="text-sm text-muted-foreground mt-1">All bounties have been reviewed.</p>
        </div>
      )}

      {/* Bounty cards */}
      <div className="space-y-4">
        {bounties.map(bounty => {
          const ocEntry = bounty.state_history?.findLast(h => h.review)
          const oc = ocEntry?.review
          const isExpanded = selected?.id === bounty.id

          return (
            <div key={bounty.id} className="border border-border/40 rounded-xl overflow-hidden">
              {/* Summary row */}
              <button
                className="w-full flex items-start gap-4 p-5 text-left hover:bg-secondary/10 transition-colors"
                onClick={() => setSelected(isExpanded ? null : bounty)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-foreground truncate">{bounty.title}</span>
                    {oc && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        oc.decision === 'allow' ? 'bg-emerald-500/15 text-emerald-400'
                          : oc.decision === 'reject' ? 'bg-red-500/15 text-red-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {oc.decision === 'allow' ? '✓ Clean' : oc.decision === 'manual_review' ? '⚠ Review' : '✗ Flagged'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {bounty.funder?.full_name || bounty.funder?.email || 'Unknown funder'} ·{' '}
                    {bounty.total_budget.toLocaleString()} {bounty.currency} ·{' '}
                    {new Date(bounty.created_at).toLocaleDateString()}
                  </p>
                  {oc && <ScoreBar score={oc.score} />}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="rounded-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={acting === bounty.id}
                    onClick={e => { e.stopPropagation(); act(bounty.id, 'approve') }}
                  >
                    {acting === bounty.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full h-8 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    disabled={acting === bounty.id}
                    onClick={e => { e.stopPropagation(); setSelected(isExpanded ? null : bounty) }}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border/30 p-5 space-y-5 bg-secondary/5">
                  {/* Description */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{bounty.description}</p>
                  </div>

                  {/* OpenClaw signals */}
                  {oc && oc.signals.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">OpenClaw Risk Signals</p>
                      <div className="space-y-2">
                        {oc.signals.map((s, i) => (
                          <div key={i} className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                            s.severity === 'high' ? 'bg-red-500/10 text-red-300'
                              : s.severity === 'medium' ? 'bg-amber-500/10 text-amber-300'
                              : 'bg-secondary/50 text-muted-foreground'
                          }`}>
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span><strong>{s.severity.toUpperCase()}</strong> · {s.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestones */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Milestones ({bounty.milestones?.length || 0})
                    </p>
                    <div className="space-y-1">
                      {bounty.milestones?.map((m, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{m.title}</span>
                          <span className="text-foreground font-mono">{m.payout_percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reject form */}
                  <div className="border-t border-border/30 pt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Rejection reason (required to reject)
                    </p>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Explain what needs to change for the funder to resubmit..."
                      className="w-full h-20 rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm text-foreground resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent/50"
                    />
                    <div className="flex gap-3 mt-3">
                      <Button
                        size="sm"
                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={acting === bounty.id}
                        onClick={() => act(bounty.id, 'approve')}
                      >
                        {acting === bounty.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                        Approve &amp; publish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                        disabled={acting === bounty.id || !rejectReason.trim()}
                        onClick={() => act(bounty.id, 'reject', rejectReason)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Send back to funder
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Lab Verification Requests */}
      {verifyRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pt-4 border-t border-border/30">
            <Shield className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-medium text-foreground">Lab Verification Requests</h2>
            <Badge className="bg-blue-500/15 text-blue-400 border-0">{verifyRequests.length}</Badge>
          </div>
          {verifyRequests.map(req => {
            const d = req.data as Record<string, string>
            return (
              <div key={req.id} className="border border-border/40 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{d.lab_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Requesting: <span className="text-foreground">{d.current_tier}</span> → <span className="text-blue-400 font-medium">{d.requested_tier}</span>
                    </p>
                    {d.institution && <p className="text-xs text-muted-foreground">Institution: {d.institution}</p>}
                    {d.notes && <p className="text-xs text-muted-foreground mt-1">{d.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={async () => {
                        await fetch('/api/labs/verify', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ labId: d.lab_id, action: 'approve', tier: d.requested_tier }) })
                        toast.success(`${d.lab_name} upgraded to ${d.requested_tier}`)
                        setVerifyRequests(r => r.filter(x => x.id !== req.id))
                      }}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full h-8 border-red-500/30 text-red-400"
                      onClick={async () => {
                        await fetch('/api/labs/verify', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ labId: d.lab_id, action: 'reject', reason: 'Insufficient credentials provided' }) })
                        toast.success('Request declined')
                        setVerifyRequests(r => r.filter(x => x.id !== req.id))
                      }}>
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* How it works */}
      <div className="border-t border-border/30 pt-6 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> New bounties go to <code className="bg-secondary px-1 rounded">admin_review</code> state automatically.</div>
        <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Approved → <code className="bg-secondary px-1 rounded">funding_escrow</code> — funder can now fund it, then labs see it.</div>
        <div className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-red-400" /> Rejected → <code className="bg-secondary px-1 rounded">cancelled</code> — funder gets an email with your reason.</div>
        <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-accent" /> OpenClaw runs automatically on every submission and flags risk signals.</div>
      </div>
    </div>
  )
}
