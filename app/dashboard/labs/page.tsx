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
import { Search, FlaskConical, Shield, ShieldCheck, Building2, Star, MapPin, ExternalLink, Plus, RefreshCw, AlertTriangle } from "lucide-react"
import { useLabs } from "@/hooks/use-labs"
import Link from "next/link"

const tierConfig: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  unverified: { label: "Unverified", color: "bg-secondary text-muted-foreground", icon: Shield },
  basic: { label: "Basic", color: "bg-secondary text-muted-foreground", icon: Shield },
  verified: { label: "Verified", color: "bg-amber-500/20 text-amber-400 border border-amber-500/30", icon: ShieldCheck },
  trusted: { label: "Trusted", color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", icon: ShieldCheck },
  institutional: { label: "Institutional", color: "bg-blue-500/20 text-blue-400 border border-blue-500/30", icon: Building2 },
}

export default function LabsPage() {
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState("all")
  
  const { labs, isLoading, error, refresh } = useLabs({
    tier: tierFilter === "all" ? undefined : tierFilter,
    search: search || undefined,
  })

  const hasError = error !== null
  const isEmpty = !isLoading && !hasError && labs.length === 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-foreground">Labs</h1>
          <p className="text-sm text-muted-foreground">Find verified research labs</p>
        </div>
        <Link href="/signup?role=lab">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Apply as Lab
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search labs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border rounded-full"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border rounded-full">
            <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
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
            <Card key={i} className="bg-card border-border rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-xl bg-secondary" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2 bg-secondary" />
                    <Skeleton className="h-4 w-1/2 bg-secondary" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-3 bg-secondary" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full bg-secondary" />
                  <Skeleton className="h-6 w-16 rounded-full bg-secondary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasError ? (
        <Card className="bg-card border-border rounded-xl">
          <CardContent className="p-10 text-center">
            <AlertTriangle className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium text-foreground mb-2">Unable to load labs</p>
            <p className="text-sm text-muted-foreground mb-4">Please check your connection and try again.</p>
            <Button 
              variant="outline" 
              onClick={() => refresh()}
              className="border-border text-foreground hover:bg-secondary rounded-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      ) : isEmpty ? (
        <Card className="bg-card border-border rounded-xl">
          <CardContent className="p-10 text-center">
            <FlaskConical className="w-10 h-10 mx-auto text-accent mb-4" />
            <p className="font-semibold text-foreground mb-2">
              {search ? "No labs match your search" : "No labs registered yet"}
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {search ? "Try different keywords" : "Be among the first labs to join SciFlow"}
            </p>
            {!search && (
              <Link href="/signup?role=lab">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                  <Plus className="w-4 h-4 mr-2" /> Apply as Lab
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labs.map((lab) => {
            const tier = tierConfig[lab.verification_tier] || tierConfig.unverified
            const TierIcon = tier.icon
            
            return (
              <Card 
                key={lab.id} 
                className="bg-card border-border hover:border-accent/30 transition-colors rounded-xl"
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center">
                        <FlaskConical className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{lab.name}</h3>
                        {lab.institution && (
                          <p className="text-xs text-muted-foreground">{lab.institution}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={`${tier.color} text-xs`}>
                      <TierIcon className="w-3 h-3 mr-1" />
                      {tier.label}
                    </Badge>
                  </div>

                  {/* Location */}
                  {lab.country && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3" />
                      {lab.country}
                    </div>
                  )}

                  {/* Specializations */}
                  {lab.specializations && lab.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {lab.specializations.slice(0, 3).map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs font-normal bg-secondary text-muted-foreground">
                          {s}
                        </Badge>
                      ))}
                      {lab.specializations.length > 3 && (
                        <Badge variant="secondary" className="text-xs font-normal bg-secondary text-muted-foreground">
                          +{lab.specializations.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-medium text-foreground">
                        {lab.reputation_score?.toFixed(1) || "—"}
                      </span>
                    </div>
                    {lab.staking_balance > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ${lab.staking_balance.toLocaleString()} staked
                      </span>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
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
