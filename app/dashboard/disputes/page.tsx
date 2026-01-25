"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Scale, Clock, CheckCircle } from "lucide-react"
import { useBounties } from "@/hooks/use-bounties"

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_review: { label: "Pending Review", color: "bg-amber-100 text-amber-700" },
  in_arbitration: { label: "In Arbitration", color: "bg-blue-100 text-blue-700" },
  resolved_funder: { label: "Resolved - Funder", color: "bg-emerald-100 text-emerald-700" },
  resolved_lab: { label: "Resolved - Lab", color: "bg-emerald-100 text-emerald-700" },
  dismissed: { label: "Dismissed", color: "bg-slate-100 text-slate-600" },
}

export default function DisputesPage() {
  const { bounties, isLoading, error } = useBounties({ state: "dispute_resolution" })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Disputes</h1>
        <p className="text-sm text-slate-500">Manage active disputes and arbitration</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-xl font-semibold text-slate-900">{bounties.length}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Scale className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xl font-semibold text-slate-900">0</p>
              <p className="text-xs text-slate-500">In Arbitration</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-xl font-semibold text-slate-900">0</p>
              <p className="text-xs text-slate-500">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
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
            <p className="text-slate-500">Unable to load disputes</p>
          </CardContent>
        </Card>
      ) : bounties.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <AlertTriangle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No active disputes</p>
            <p className="text-sm text-slate-400 mt-1">All bounties are running smoothly</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bounties.map((bounty) => (
            <Card key={bounty.id} className="border-slate-200 border-l-4 border-l-red-400">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">{bounty.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      ${(bounty.total_budget || 0).toLocaleString()} at stake
                    </p>
                  </div>
                  <Badge className="bg-red-100 text-red-700">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Dispute
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
