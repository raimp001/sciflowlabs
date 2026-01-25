"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Lock, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Escrow {
  id: string
  bounty_id: string
  amount: number
  currency: string
  status: string
  payment_method: string
  created_at: string
  bounty?: { title: string }
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Lock }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  held: { label: "Held", color: "bg-blue-100 text-blue-700", icon: Lock },
  released: { label: "Released", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  refunded: { label: "Refunded", color: "bg-slate-100 text-slate-600", icon: AlertTriangle },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-700", icon: AlertTriangle },
}

export default function EscrowPage() {
  const [escrows, setEscrows] = useState<Escrow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchEscrows() {
      try {
        const supabase = createClient()
        if (!supabase) {
          setEscrows([])
          return
        }

        const { data, error: queryError } = await supabase
          .from('escrows')
          .select('*, bounty:bounties(title)')
          .order('created_at', { ascending: false })

        if (queryError) throw queryError
        setEscrows(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch escrows'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchEscrows()
  }, [])

  const totalHeld = escrows
    .filter(e => e.status === 'held')
    .reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Escrow</h1>
        <p className="text-sm text-slate-500">Track escrowed funds</p>
      </div>

      {/* Total Held */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Held in Escrow</p>
          <p className="text-3xl font-semibold text-slate-900">${totalHeld.toLocaleString()}</p>
        </CardContent>
      </Card>

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
            <p className="text-slate-500">Unable to load escrows</p>
          </CardContent>
        </Card>
      ) : escrows.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <Lock className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No escrows</p>
            <p className="text-sm text-slate-400 mt-1">Funds will appear here when bounties are funded</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {escrows.map((escrow) => {
            const status = statusConfig[escrow.status] || statusConfig.pending
            const StatusIcon = status.icon
            return (
              <Card key={escrow.id} className="border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {escrow.bounty?.title || "Bounty"}
                      </h3>
                      <p className="text-sm text-slate-500">
                        ${escrow.amount.toLocaleString()} {escrow.currency}
                        <span className="ml-2 capitalize">via {escrow.payment_method?.replace('_', ' ')}</span>
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
