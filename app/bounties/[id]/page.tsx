import { mockBounties } from "@/lib/bounty-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  DollarSign,
  Building2,
  Clock,
  Target,
  CheckCircle2,
  ArrowLeft,
  Users,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export function generateStaticParams() {
  return mockBounties.map((bounty) => ({
    id: bounty.id,
  }))
}

export default async function BountyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bounty = mockBounties.find((b) => b.id === id)

  if (!bounty) {
    notFound()
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
      case "in_progress":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      case "completed":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "low":
        return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
      case "high":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20"
      case "critical":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/bounties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bounties
          </Link>
        </Button>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{bounty.title}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={getStatusColor(bounty.status)} variant="outline">
                  {bounty.status.replace("_", " ").toUpperCase()}
                </Badge>
                <Badge className={getUrgencyColor(bounty.urgency)} variant="outline">
                  {bounty.urgency.toUpperCase()} URGENCY
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {bounty.researchArea.replace("_", " ")}
                </Badge>
              </div>
            </div>
            {bounty.status === "open" && (
              <Button size="lg" className="shadow-soft-lg">
                Apply for This Bounty
              </Button>
            )}
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Total Funding</div>
                    <div className="text-xl font-bold text-primary">
                      {formatCurrency(bounty.fundingAmount)}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Deadline</div>
                    <div className="font-semibold">{formatDate(bounty.deadline)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Applicants</div>
                    <div className="font-semibold">{bounty.applicantsCount} labs</div>
                  </div>
                </div>
                {bounty.estimatedDuration && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                      <div className="font-semibold">{bounty.estimatedDuration}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{bounty.description}</p>
            </CardContent>
          </Card>

          {/* Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Research Objectives
              </CardTitle>
              <CardDescription>Key goals for this research project</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {bounty.objectives.map((objective, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Deliverables */}
          <Card>
            <CardHeader>
              <CardTitle>Expected Deliverables</CardTitle>
              <CardDescription>What the lab will provide upon completion</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {bounty.deliverables.map((deliverable, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                    </div>
                    <span className="text-sm leading-relaxed">{deliverable}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Milestones */}
          {bounty.milestones && bounty.milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Funding Milestones</CardTitle>
                <CardDescription>
                  Funding will be released in stages as milestones are completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bounty.milestones.map((milestone, idx) => (
                    <div key={milestone.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">Milestone {idx + 1}</span>
                            <Badge variant="outline" className="text-xs">
                              {milestone.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <h4 className="font-medium mb-1">{milestone.title}</h4>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            {formatCurrency(milestone.fundingAmount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(milestone.deadline)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Accepted Lab */}
          {bounty.acceptedLabName && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Accepted Lab
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-lg">{bounty.acceptedLabName}</div>
                    <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                      <Link href={`/labs/${bounty.acceptedLabId}`}>View Lab Profile</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bounty Creator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="font-medium">{bounty.createdBy}</div>
                <div className="text-sm text-muted-foreground">
                  Posted on {formatDate(bounty.createdAt)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {bounty.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Application CTA */}
          {bounty.status === "open" && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <AlertCircle className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-semibold">Interested in this bounty?</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit your application and showcase your lab's capabilities
                  </p>
                  <Button className="w-full">Apply Now</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
