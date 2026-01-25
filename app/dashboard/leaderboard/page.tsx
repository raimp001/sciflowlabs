"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Star, Medal, FlaskConical } from "lucide-react"
import { useLabs } from "@/hooks/use-labs"

const rankStyles = [
  { bg: "bg-amber-100", text: "text-amber-700", icon: "🥇" },
  { bg: "bg-slate-100", text: "text-slate-600", icon: "🥈" },
  { bg: "bg-orange-100", text: "text-orange-700", icon: "🥉" },
]

export default function LeaderboardPage() {
  const { labs, isLoading, error } = useLabs({ limit: 20 })

  // Sort by reputation
  const rankedLabs = [...labs].sort((a, b) => 
    (b.reputation_score || 0) - (a.reputation_score || 0)
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-amber-500" />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Leaderboard</h1>
          <p className="text-sm text-slate-500">Top performing research labs</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-16 ml-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <p className="text-slate-500">Unable to load leaderboard</p>
          </CardContent>
        </Card>
      ) : rankedLabs.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <Medal className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No labs yet</p>
            <p className="text-sm text-slate-400 mt-1">Rankings will appear as labs join</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rankedLabs.map((lab, index) => {
            const style = rankStyles[index] || { bg: "bg-slate-50", text: "text-slate-500", icon: `${index + 1}` }
            return (
              <Card key={lab.id} className="border-slate-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center text-lg font-medium ${style.text}`}>
                    {index < 3 ? style.icon : index + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <FlaskConical className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{lab.name}</h3>
                      <p className="text-xs text-slate-500">{lab.institution || lab.country || "—"}</p>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Bounties</p>
                      <p className="font-medium text-slate-900">{lab.bounties_completed || 0}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-semibold text-amber-700">
                        {lab.reputation_score?.toFixed(1) || "0.0"}
                      </span>
                    </div>
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
