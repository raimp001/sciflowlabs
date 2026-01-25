"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Proposal } from "@/types/database"

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  rejected: { label: "Not Selected", color: "bg-slate-100 text-slate-600", icon: XCircle },
  withdrawn: { label: "Withdrawn", color: "bg-slate-100 text-slate-500", icon: XCircle },
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchProposals() {
      try {
        const supabase = createClient()
        if (!supabase) {
          setProposals([])
          return
        }

        const { data, error: queryError } = await supabase
          .from('proposals')
          .select('*, bounty:bounties(title, total_budget, currency)')
          .order('created_at', { ascending: false })

        if (queryError) throw queryError
        setProposals(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch proposals'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchProposals()
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">My Proposals</h1>
        <p className="text-sm text-slate-500">Track your submitted proposals</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <p className="text-slate-500">Unable to load proposals</p>
          </CardContent>
        </Card>
      ) : proposals.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No proposals yet</p>
            <p className="text-sm text-slate-400 mt-1">Submit proposals on open bounties</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => {
            const status = statusConfig[proposal.status] || statusConfig.pending
            const StatusIcon = status.icon
            return (
              <Card key={proposal.id} className="border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {(proposal as { bounty?: { title: string } }).bounty?.title || "Bounty"}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Proposed: ${proposal.proposed_budget?.toLocaleString() || "—"}
                      </p>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
