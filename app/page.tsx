"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  ArrowRight, 
  FlaskConical, 
  Shield, 
  Wallet, 
  Users, 
  Lock,
  CheckCircle2,
  FileText,
  CircleDollarSign,
  Zap
} from "lucide-react"

const features = [
  {
    icon: Lock,
    title: "Milestone-Based Escrow",
    description: "Funds are locked in secure escrow (Stripe or on-chain) and released only when research milestones are verified.",
  },
  {
    icon: Shield,
    title: "Proof of Research",
    description: "Every deliverable is hashed on-chain, creating an immutable record of scientific accountability.",
  },
  {
    icon: Users,
    title: "Verified Labs",
    description: "Labs stake tokens to bid on bounties. Reputation tiers ensure only credible researchers compete.",
  },
  {
    icon: Wallet,
    title: "Hybrid Payments",
    description: "Pay with credit card via Stripe or crypto (USDC on Solana/Base). You choose your preferred method.",
  },
]

const stats = [
  { value: "$12M+", label: "Research Funded" },
  { value: "847", label: "Bounties Completed" },
  { value: "156", label: "Verified Labs" },
  { value: "99.2%", label: "Success Rate" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-navy-950 dark:via-navy-900 dark:to-navy-950">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 pattern-dots opacity-30" />
        
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-sage-400/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center">
            <Badge className="mb-6 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
              <Zap className="w-3 h-3 mr-1" />
              Decentralized Science Platform
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-navy-900 dark:text-white leading-tight tracking-tight">
              Fund Breakthrough
              <span className="block text-gradient-amber">Research with Trust</span>
            </h1>
            
            <p className="mt-6 text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              SciFlow connects funders with verified labs through milestone-based bounties. 
              Escrow-protected payments ensure accountability. No results, no payout.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-navy-800 hover:bg-navy-700 text-white px-8 py-6 text-lg">
                  Launch App
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-2">
                <FileText className="w-5 h-5 mr-2" />
                Read Whitepaper
              </Button>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card 
                key={stat.label} 
                className="border-0 shadow-clause-md bg-white/80 dark:bg-navy-800/80 backdrop-blur animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <p className="text-3xl md:text-4xl font-bold text-navy-800 dark:text-white font-mono">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50 dark:bg-navy-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-800 dark:text-white">
              How SciFlow Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A transparent, accountable workflow from bounty creation to payout
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Create Bounty", desc: "Define protocols, milestones, and budget", icon: FileText },
              { step: "02", title: "Fund Escrow", desc: "Lock funds via Stripe or crypto", icon: Lock },
              { step: "03", title: "Labs Bid", desc: "Verified labs stake tokens to compete", icon: Users },
              { step: "04", title: "Verify & Pay", desc: "Review evidence, release funds", icon: CheckCircle2 },
            ].map((item, index) => (
              <div 
                key={item.step} 
                className="relative animate-fade-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <Card className="border-0 shadow-clause-md h-full hover:shadow-clause-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl font-bold text-amber-400/50">{item.step}</span>
                      <div className="p-3 rounded-xl bg-navy-100 dark:bg-navy-800">
                        <item.icon className="w-6 h-6 text-navy-600 dark:text-navy-300" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-navy-800 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
                {index < 3 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-400 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-sage-100 text-sage-700 border-sage-200">
                Built for Trust
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-navy-800 dark:text-white mb-6">
                Accountability at Every Step
              </h2>
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div 
                    key={feature.title} 
                    className="flex gap-4 animate-fade-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-shrink-0 p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 h-fit">
                      <feature.icon className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-800 dark:text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visual Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-sage-400/20 rounded-3xl blur-2xl" />
              <Card className="relative border-0 shadow-clause-xl overflow-hidden">
                <CardContent className="p-0">
                  {/* Mock State Machine Visualization */}
                  <div className="p-8 bg-gradient-to-br from-navy-800 to-navy-900">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-3 h-3 rounded-full bg-alert-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-sage-500" />
                    </div>
                    <div className="space-y-4">
                      {["Drafting", "Funding", "Bidding", "Research", "Review", "Payout"].map((state, i) => (
                        <div key={state} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i < 4 ? 'bg-sage-500' : i === 4 ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`}>
                            {i < 4 ? (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span className={`font-mono text-sm ${i <= 4 ? 'text-white' : 'text-slate-500'}`}>
                            {state}
                          </span>
                          {i === 4 && (
                            <Badge className="ml-auto bg-amber-500/20 text-amber-400 border-0 text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 bg-white dark:bg-navy-800">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">Escrow Balance</span>
                      <Badge variant="outline" className="bg-sage-50 text-sage-700 border-sage-200">
                        Secured
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold font-mono text-navy-800 dark:text-white">
                      125,000 <span className="text-lg text-muted-foreground">USDC</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="border-0 shadow-clause-xl bg-gradient-to-r from-navy-800 to-navy-900 overflow-hidden relative">
            <div className="absolute inset-0 pattern-dots opacity-10" />
            <CardContent className="relative p-12 text-center">
              <FlaskConical className="w-16 h-16 mx-auto text-amber-400 mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Fund the Future?
              </h2>
              <p className="text-xl text-navy-200 mb-8 max-w-2xl mx-auto">
                Join the decentralized science movement. Create your first bounty or browse open opportunities.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold px-8">
                    <CircleDollarSign className="w-5 h-5 mr-2" />
                    Create Bounty
                  </Button>
                </Link>
                <Link href="/dashboard/open-bounties">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8">
                    Browse Open Bounties
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-navy-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-amber-400" />
              </div>
              <span className="font-bold text-navy-800 dark:text-white">SciFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 SciFlow. Decentralizing Science, One Bounty at a Time.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-amber-600">Docs</a>
              <a href="#" className="hover:text-amber-600">GitHub</a>
              <a href="#" className="hover:text-amber-600">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
