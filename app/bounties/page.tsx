"use client"

import { useState, useMemo } from "react"
import { mockBounties } from "@/lib/bounty-data"
import { Bounty, BountyStatus, ResearchArea } from "@/types/bounty"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, DollarSign, Target, Building2, Clock, AlertCircle, Search } from "lucide-react"
import Link from "next/link"

export default function BountiesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [researchAreaFilter, setResearchAreaFilter] = useState<string>("all")
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all")
  const [minFunding, setMinFunding] = useState<number>(0)

  const filteredBounties = useMemo(() => {
    return mockBounties.filter((bounty) => {
      const matchesSearch =
        bounty.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bounty.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bounty.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === "all" || bounty.status === statusFilter
      const matchesResearchArea = researchAreaFilter === "all" || bounty.researchArea === researchAreaFilter
      const matchesUrgency = urgencyFilter === "all" || bounty.urgency === urgencyFilter
      const matchesFunding = bounty.fundingAmount >= minFunding

      return matchesSearch && matchesStatus && matchesResearchArea && matchesUrgency && matchesFunding
    })
  }, [searchQuery, statusFilter, researchAreaFilter, urgencyFilter, minFunding])

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    return `$${amount.toLocaleString()}`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: BountyStatus) => {
    switch (status) {
      case "open":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "in_progress":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "completed":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "low":
        return "bg-slate-500/10 text-slate-700 dark:text-slate-400"
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      case "high":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400"
      case "critical":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Research Bounties</h1>
            <p className="text-muted-foreground">Fund breakthrough scientific research</p>
          </div>
          <Button asChild>
            <Link href="/bounties/create">
              <Target className="mr-2 h-4 w-4" />
              Create New Bounty
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Bounties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bounties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={researchAreaFilter} onValueChange={setResearchAreaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Research Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
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

              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={minFunding.toString()}
                onValueChange={(value) => setMinFunding(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Min Funding" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Funding</SelectItem>
                  <SelectItem value="10000000">$10M+</SelectItem>
                  <SelectItem value="25000000">$25M+</SelectItem>
                  <SelectItem value="50000000">$50M+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredBounties.length} of {mockBounties.length} bounties
      </div>

      {/* Bounties Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBounties.map((bounty) => (
          <Card key={bounty.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{bounty.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{bounty.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(bounty.status)}>
                  {bounty.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {bounty.researchArea.replace("_", " ")}
                </Badge>
                <Badge className={getUrgencyColor(bounty.urgency)}>
                  {bounty.urgency} urgency
                </Badge>
                {bounty.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-primary">
                    {formatCurrency(bounty.fundingAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(bounty.deadline)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{bounty.applicantsCount} applicants</span>
                </div>
                {bounty.estimatedDuration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{bounty.estimatedDuration}</span>
                  </div>
                )}
              </div>

              {bounty.acceptedLabName && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">Accepted by:</span>
                    <span>{bounty.acceptedLabName}</span>
                  </div>
                </div>
              )}

              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground mb-2">Key Objectives:</p>
                <ul className="text-sm space-y-1">
                  {bounty.objectives.slice(0, 2).map((objective, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="line-clamp-1">{objective}</span>
                    </li>
                  ))}
                  {bounty.objectives.length > 2 && (
                    <li className="text-muted-foreground italic">
                      +{bounty.objectives.length - 2} more objectives
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link href={`/bounties/${bounty.id}`}>View Details</Link>
              </Button>
              {bounty.status === "open" && (
                <Button className="flex-1">Apply Now</Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredBounties.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bounties found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search criteria
            </p>
            <Button onClick={() => {
              setSearchQuery("")
              setStatusFilter("all")
              setResearchAreaFilter("all")
              setUrgencyFilter("all")
              setMinFunding(0)
            }}>
              Clear Filters
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
