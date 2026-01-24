import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Beaker, Target, Building2, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 text-center bg-gradient-to-b from-background to-muted/40">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-primary tracking-tight">
          LabBounty
        </h1>
        <p className="text-xl md:text-2xl text-foreground mb-4 max-w-3xl font-medium">
          Revolutionizing Scientific Research Funding
        </p>
        <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl leading-relaxed">
          Connect breakthrough ideas with world-class research labs. Fund the science that matters to you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="text-base px-8 shadow-soft-lg">
            <Link href="/bounties">Browse Bounties</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-base px-8 shadow-soft">
            <Link href="/bounties/create">Create a Bounty</Link>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          A simple, transparent process to fund the research that matters most
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 shadow-soft hover:shadow-soft-lg transition-all border-border/50">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 rounded-2xl mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Create a Bounty</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Define your research idea, set funding amount, and establish deadlines
              </p>
            </div>
          </Card>

          <Card className="p-6 shadow-soft hover:shadow-soft-lg transition-all border-border/50">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 rounded-2xl mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Labs Apply</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Qualified research labs review and apply to work on your bounty
              </p>
            </div>
          </Card>

          <Card className="p-6 shadow-soft hover:shadow-soft-lg transition-all border-border/50">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 rounded-2xl mb-4">
                <Beaker className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Research Begins</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Selected lab conducts research with milestone-based funding releases
              </p>
            </div>
          </Card>

          <Card className="p-6 shadow-soft hover:shadow-soft-lg transition-all border-border/50">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 rounded-2xl mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Results Delivered</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Receive validated research findings and published results
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-muted/40 py-16 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">$320M+</div>
              <div className="text-sm text-muted-foreground font-medium">Total Funding</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">150+</div>
              <div className="text-sm text-muted-foreground font-medium">Active Bounties</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">80+</div>
              <div className="text-sm text-muted-foreground font-medium">Verified Labs</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">92%</div>
              <div className="text-sm text-muted-foreground font-medium">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Fund Breakthrough Research?</h2>
        <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Whether you want to find cures for cancer, develop novel therapeutics, or advance scientific knowledge,
          LabBounty connects your vision with the labs that can make it happen.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="shadow-soft-lg">
            <Link href="/labs">Explore Labs</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="shadow-soft">
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
