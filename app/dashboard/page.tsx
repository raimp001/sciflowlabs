import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Target, Building2, PlusCircle, BarChart2, TrendingUp, DollarSign, CheckCircle } from "lucide-react"
import { mockBounties, mockLabs } from "@/lib/bounty-data"

export default function DashboardOverviewPage() {
  // Calculate stats
  const totalBounties = mockBounties.length
  const openBounties = mockBounties.filter((b) => b.status === "open").length
  const completedBounties = mockBounties.filter((b) => b.status === "completed").length
  const totalFunding = mockBounties.reduce((sum, b) => sum + b.fundingAmount, 0)
  const totalLabs = mockLabs.length
  const verifiedLabs = mockLabs.filter((l) => l.verified).length

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(0)}M`
    }
    return `$${amount.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Welcome to LabBounty. Manage your research bounties and track lab performance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bounties</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBounties}</div>
            <p className="text-xs text-muted-foreground">
              {openBounties} open, {completedBounties} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFunding)}</div>
            <p className="text-xs text-muted-foreground">Across all bounties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research Labs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLabs}</div>
            <p className="text-xs text-muted-foreground">
              {verifiedLabs} verified labs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">Average completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Browse Bounties
              </CardTitle>
              <CardDescription>
                Explore available research bounties and find opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/bounties">View Bounties</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Create Bounty
              </CardTitle>
              <CardDescription>
                Fund new research by creating a bounty for labs to work on
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/bounties/create">Create New Bounty</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Explore Labs
              </CardTitle>
              <CardDescription>
                Discover world-class research labs and their capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/labs">Browse Labs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Recent Bounties</h3>
        <div className="space-y-3">
          {mockBounties.slice(0, 5).map((bounty) => (
            <Card key={bounty.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{bounty.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {bounty.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(bounty.fundingAmount)}
                      </span>
                      <span className="capitalize">{bounty.researchArea.replace("_", " ")}</span>
                      {bounty.status === "completed" && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/bounties/${bounty.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
