"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FlaskConical, Clock } from "lucide-react"
import { useBounties } from "@/hooks/use-bounties"

function formatCurrency(amount: number, currency: string) {
  return currency === "USD" ? `$${amount.toLocaleString()}` : `${amount.toLocaleString()} ${currency}`
}

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function ResearchPage() {
  const { bounties, isLoading, error } = useBounties({ state: "active_research" })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Active Research</h1>
        <p className="text-sm text-slate-500">Your ongoing research projects</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-2 w-full rounded-full mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <p className="text-slate-500">Unable to load research</p>
          </CardContent>
        </Card>
      ) : bounties.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <FlaskConical className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No active research</p>
            <p className="text-sm text-slate-400 mt-1">Win proposals to start research</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bounties.map((bounty) => {
            const milestones = bounty.milestones || []
            const completed = milestones.filter(m => m.status === 'approved').length
            const progress = milestones.length > 0 ? (completed / milestones.length) * 100 : 0
            
            return (
              <Card key={bounty.id} className="border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{bounty.title}</h3>
                      <p className="text-sm text-slate-500">
                        {formatCurrency(bounty.total_budget || 0, bounty.currency || "USD")}
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Milestone {completed} of {milestones.length}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {bounty.deadline && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {daysUntil(bounty.deadline)} days remaining
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
