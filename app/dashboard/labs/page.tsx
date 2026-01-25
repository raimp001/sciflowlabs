"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, FlaskConical, Shield, ShieldCheck, Building2, Star, MapPin, ExternalLink } from "lucide-react"
import { useLabs } from "@/hooks/use-labs"

const tierConfig: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  unverified: { label: "Unverified", color: "bg-slate-100 text-slate-600", icon: Shield },
  basic: { label: "Basic", color: "bg-slate-100 text-slate-600", icon: Shield },
  verified: { label: "Verified", color: "bg-amber-100 text-amber-700", icon: ShieldCheck },
  trusted: { label: "Trusted", color: "bg-emerald-100 text-emerald-700", icon: ShieldCheck },
  institutional: { label: "Institutional", color: "bg-blue-100 text-blue-700", icon: Building2 },
}

export default function LabsPage() {
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState("all")
  
  const { labs, isLoading, error } = useLabs({
    tier: tierFilter,
    search: search || undefined,
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Labs</h1>
        <p className="text-sm text-slate-500">Find verified research labs</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search labs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[160px] border-slate-200">
            <Shield className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="institutional">Institutional</SelectItem>
            <SelectItem value="trusted">Trusted</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Labs Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <p className="text-slate-500">Unable to load labs</p>
            <p className="text-xs text-slate-400 mt-1">Please configure Supabase environment variables</p>
          </CardContent>
        </Card>
      ) : labs.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <FlaskConical className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">
              {search ? "No labs match your search" : "No labs registered yet"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {search ? "Try different keywords" : "Labs will appear here once registered"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labs.map((lab) => {
            const tier = tierConfig[lab.verification_tier] || tierConfig.unverified
            const TierIcon = tier.icon
            
            return (
              <Card key={lab.id} className="border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                        <FlaskConical className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">{lab.name}</h3>
                        {lab.institution && (
                          <p className="text-xs text-slate-500">{lab.institution}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={`${tier.color} border-0 text-xs`}>
                      <TierIcon className="w-3 h-3 mr-1" />
                      {tier.label}
                    </Badge>
                  </div>

                  {/* Location */}
                  {lab.country && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                      <MapPin className="w-3 h-3" />
                      {lab.country}
                    </div>
                  )}

                  {/* Specialties */}
                  {lab.specialties && lab.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {lab.specialties.slice(0, 3).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs font-normal">
                          {s}
                        </Badge>
                      ))}
                      {lab.specialties.length > 3 && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          +{lab.specialties.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {lab.reputation_score?.toFixed(1) || "—"}
                      </span>
                    </div>
                    {lab.staked_amount && (
                      <span className="text-xs text-slate-500">
                        ${lab.staked_amount.toLocaleString()} staked
                      </span>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-700">
                      View <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
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
