import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Beaker, Target, Building2, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center p-8 md:p-16 text-center bg-gradient-to-b from-background to-muted/20">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          LabBounty
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl">
          Revolutionizing Scientific Research Funding
        </p>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
          Connect breakthrough ideas with world-class research labs. Fund the science that matters to you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/bounties">Browse Bounties</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg px-8">
            <Link href="/bounties/create">Create a Bounty</Link>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create a Bounty</h3>
              <p className="text-muted-foreground">
                Define your research idea, set funding amount, and establish deadlines
              </p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Labs Apply</h3>
              <p className="text-muted-foreground">
                Qualified research labs review and apply to work on your bounty
              </p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Beaker className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Research Begins</h3>
              <p className="text-muted-foreground">
                Selected lab conducts research with milestone-based funding releases
              </p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Results Delivered</h3>
              <p className="text-muted-foreground">
                Receive validated research findings and published results
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$320M+</div>
              <div className="text-muted-foreground">Total Funding</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">150+</div>
              <div className="text-muted-foreground">Active Bounties</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">80+</div>
              <div className="text-muted-foreground">Verified Labs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">92%</div>
              <div className="text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Fund Breakthrough Research?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Whether you want to find cures for cancer, develop novel therapeutics, or advance scientific knowledge,
          LabBounty connects your vision with the labs that can make it happen.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/labs">Explore Labs</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
