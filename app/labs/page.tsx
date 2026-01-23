"use client"

import { useState, useMemo } from "react"
import { mockLabs } from "@/lib/bounty-data"
import { Lab, ResearchArea } from "@/types/bounty"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, MapPin, Users, Award, TrendingUp, Star, CheckCircle2, Search, Globe } from "lucide-react"
import Link from "next/link"

export default function LabsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [specializationFilter, setSpecializationFilter] = useState<string>("all")
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [minSuccessRate, setMinSuccessRate] = useState<number>(0)

  const filteredLabs = useMemo(() => {
    return mockLabs.filter((lab) => {
      const matchesSearch =
        lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesSpecialization =
        specializationFilter === "all" ||
        lab.specializations.includes(specializationFilter as ResearchArea)

      const matchesVerified = !verifiedOnly || lab.verified
      const matchesSuccessRate = lab.successRate >= minSuccessRate

      return matchesSearch && matchesSpecialization && matchesVerified && matchesSuccessRate
    })
  }, [searchQuery, specializationFilter, verifiedOnly, minSuccessRate])

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    return `$${amount.toLocaleString()}`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Research Labs</h1>
            <p className="text-muted-foreground">
              Discover world-class labs ready to work on your research bounties
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Labs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search labs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  <SelectItem value="oncology">Oncology</SelectItem>
                  <SelectItem value="neuroscience">Neuroscience</SelectItem>
                  <SelectItem value="immunology">Immunology</SelectItem>
                  <SelectItem value="genetics">Genetics</SelectItem>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="infectious_disease">Infectious Disease</SelectItem>
                  <SelectItem value="rare_disease">Rare Disease</SelectItem>
                  <SelectItem value="drug_discovery">Drug Discovery</SelectItem>
                  <SelectItem value="diagnostics">Diagnostics</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={minSuccessRate.toString()}
                onValueChange={(value) => setMinSuccessRate(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Min Success Rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Labs</SelectItem>
                  <SelectItem value="80">80%+ Success</SelectItem>
                  <SelectItem value="90">90%+ Success</SelectItem>
                  <SelectItem value="95">95%+ Success</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant={verifiedOnly ? "default" : "outline"}
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className="w-full"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verified Only
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredLabs.length} of {mockLabs.length} labs
      </div>

      {/* Labs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLabs.map((lab) => (
          <Card key={lab.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{lab.name}</CardTitle>
                    {lab.verified && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" title="Verified Lab" />
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">{lab.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location and Website */}
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{lab.location}</span>
                </div>
                {lab.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <a
                      href={lab.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary underline"
                    >
                      {lab.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Specializations */}
              <div className="flex flex-wrap gap-2">
                {lab.specializations.map((spec) => (
                  <Badge key={spec} variant="outline" className="capitalize">
                    {spec.replace("_", " ")}
                  </Badge>
                ))}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y">
                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{lab.completedBounties}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{lab.activeBounties}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{lab.successRate}%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{lab.teamSize}</div>
                    <div className="text-xs text-muted-foreground">Team Size</div>
                  </div>
                </div>
              </div>

              {/* Funding and Rating */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Funding</div>
                  <div className="text-lg font-semibold text-primary">
                    {formatCurrency(lab.totalFundingReceived)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Rating</div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-lg font-semibold">{lab.rating}</span>
                    <span className="text-sm text-muted-foreground">/5</span>
                  </div>
                </div>
              </div>

              {/* Key Capabilities */}
              <div>
                <p className="text-sm font-medium mb-2">Key Capabilities:</p>
                <div className="flex flex-wrap gap-1">
                  {lab.capabilities.slice(0, 4).map((capability) => (
                    <Badge key={capability} variant="secondary" className="text-xs">
                      {capability}
                    </Badge>
                  ))}
                  {lab.capabilities.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{lab.capabilities.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>Est. {lab.established}</span>
                {lab.publications && <span>{lab.publications} publications</span>}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/labs/${lab.id}`}>View Lab Profile</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredLabs.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No labs found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search criteria
            </p>
            <Button
              onClick={() => {
                setSearchQuery("")
                setSpecializationFilter("all")
                setVerifiedOnly(false)
                setMinSuccessRate(0)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
