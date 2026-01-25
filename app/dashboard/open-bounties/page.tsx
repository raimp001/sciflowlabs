"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, FlaskConical, Send, Clock } from "lucide-react"
import { useBounties } from "@/hooks/use-bounties"
import { useState } from "react"

function formatCurrency(amount: number, currency: string) {
  return currency === "USD" ? `$${amount.toLocaleString()}` : `${amount.toLocaleString()} ${currency}`
}

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function OpenBountiesPage() {
  const [search, setSearch] = useState("")
  const { bounties, isLoading, error } = useBounties({ 
    state: "bidding",
    search: search || undefined 
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Open Bounties</h1>
        <p className="text-sm text-slate-500">Browse and submit proposals for available bounties</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search open bounties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 border-slate-200"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-9 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <p className="text-slate-500">Unable to load bounties</p>
          </CardContent>
        </Card>
      ) : bounties.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <FlaskConical className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No open bounties</p>
            <p className="text-sm text-slate-400 mt-1">Check back later for new opportunities</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bounties.map((bounty) => (
            <Card key={bounty.id} className="border-slate-200 hover:border-slate-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-1">{bounty.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{bounty.description}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 whitespace-nowrap">
                    Open for Bids
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="font-medium text-slate-900">
                      {formatCurrency(bounty.total_budget || 0, bounty.currency || "USD")}
                    </span>
                    {bounty.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {daysUntil(bounty.deadline)} days left
                      </span>
                    )}
                  </div>
                  <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Submit Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
