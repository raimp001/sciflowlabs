import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { SciFlowLogo } from "@/components/sciflow-logo"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center">
          <SciFlowLogo size="lg" showText={true} />
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/whitepaper" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
            Whitepaper
          </Link>
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
            Docs
          </Link>
          <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
            FAQ
          </Link>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block font-medium">
            Sign In
          </Link>
          <Link href="/dashboard">
            <Button className="rounded-full px-7 h-11 text-sm font-semibold shadow-md hover:shadow-lg">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 pt-20 md:pt-28 pb-28 md:pb-36 text-center">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 md:mb-8 leading-[1.08] tracking-tight">
          Got an idea?<br />
          <span className="text-muted-foreground">Get it validated.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed">
          You don&apos;t need a lab. Post your research idea as a bounty.
          Verified labs compete to make it happen. Pay only when they prove results.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button size="lg" className="rounded-full px-8 h-14 text-base font-semibold shadow-lg hover:shadow-xl">
              Start a Research Bounty
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/dashboard/open-bounties">
            <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base font-medium">
              Browse Bounties
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground/80">
          No account required to browse
        </p>
      </main>

      {/* For Idea Holders Section */}
      <section className="border-t border-border py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14 md:mb-16">
            <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-4">FOR IDEA HOLDERS</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-5">
              No lab? No problem.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              You have a breakthrough idea but no equipment, no lab, no team.
              Post it as a bounty and let verified researchers compete to make it real.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            <div className="text-center p-7 rounded-2xl bg-card border border-border hover:border-accent/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <span className="text-xl font-serif text-primary">1</span>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-3">Post Your Idea</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Describe your research question, what success looks like, and set your budget. Funds go into escrow.
              </p>
            </div>

            <div className="text-center p-7 rounded-2xl bg-card border border-border hover:border-accent/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <span className="text-xl font-serif text-primary">2</span>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-3">Labs Compete</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Only <strong className="text-foreground">verified labs</strong> with proven credentials can submit proposals. Compare their track record.
              </p>
            </div>

            <div className="text-center p-7 rounded-2xl bg-card border border-border hover:border-accent/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <span className="text-xl font-serif text-primary">3</span>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-3">Verify Results</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Labs submit <strong className="text-foreground">proof of research</strong>—data, reports, evidence—at each milestone. You review and approve.
              </p>
            </div>

            <div className="text-center p-7 rounded-2xl bg-card border border-border hover:border-accent/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <span className="text-xl font-serif text-primary">4</span>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-3">Pay on Proof</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Funds release only when milestones are verified. No proof, no payment. Your money is protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Labs Section */}
      <section className="py-20 md:py-28 bg-card/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14 md:mb-16">
            <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-4">FOR LABS & RESEARCHERS</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-5">
              Get paid for your expertise
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Access a global pool of funded research projects. Your verification status unlocks higher-value bounties.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="p-7 md:p-8 rounded-2xl bg-background border border-border hover:border-emerald-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-emerald-400">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Get Verified</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Submit your credentials, publications, and equipment list. Higher tiers unlock bigger bounties.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground">Basic</span>
                <span className="px-3 py-1.5 rounded-full bg-blue-500/20 text-xs font-medium text-blue-400">Verified</span>
                <span className="px-3 py-1.5 rounded-full bg-amber-500/20 text-xs font-medium text-amber-400">Trusted</span>
                <span className="px-3 py-1.5 rounded-full bg-purple-500/20 text-xs font-medium text-purple-400">Institutional</span>
              </div>
            </div>

            <div className="p-7 md:p-8 rounded-2xl bg-background border border-border hover:border-blue-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-blue-400">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Submit Proposals</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse open bounties. Submit your methodology, timeline, and why you&apos;re the right fit. Compete on merit.
              </p>
            </div>

            <div className="p-7 md:p-8 rounded-2xl bg-background border border-border hover:border-accent/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-primary">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Prove & Get Paid</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Submit evidence for each milestone—raw data, lab reports, IPFS-hashed files. Once verified, funds release instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Verification */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-5 md:mb-6">
            Built on proof, not promises
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12 md:mb-14 text-base md:text-lg leading-relaxed">
            Every payout requires verified evidence. Labs stake reputation and funds. Disputes are resolved by neutral arbitrators.
          </p>

          <div className="grid sm:grid-cols-3 gap-5 md:gap-6">
            <div className="p-6 md:p-7 rounded-2xl border border-border bg-card/30 hover:bg-card/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-emerald-400">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-3">Lab Verification</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Only registered labs with verified credentials can accept bounties. No anonymous actors.
              </p>
            </div>

            <div className="p-6 md:p-7 rounded-2xl border border-border bg-card/30 hover:bg-card/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-blue-400">
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-3">IPFS Evidence</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Research data is hashed and stored immutably. Tamper-proof records ensure authenticity.
              </p>
            </div>

            <div className="p-6 md:p-7 rounded-2xl border border-border bg-card/30 hover:bg-card/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-primary">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-3">Dispute Resolution</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Disagreements are reviewed by neutral arbitrators. Fair outcomes, transparent process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founding Cohort */}
      <section id="founding" className="py-20 md:py-28 bg-card/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-block px-5 py-2 rounded-full bg-accent/15 text-accent text-sm font-semibold mb-7">
            Limited Early Access
          </div>

          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-5 md:mb-6">
            Join the Founding Cohort
          </h2>

          <p className="text-base md:text-lg text-muted-foreground mb-10 md:mb-12 max-w-xl mx-auto leading-relaxed">
            First 50 funders and 100 labs get 0% fees on their first 3 bounties,
            plus governance tokens and priority support.
          </p>

          <div className="grid sm:grid-cols-3 gap-5 mb-10 md:mb-12">
            <div className="p-6 md:p-7 rounded-2xl bg-card border border-border">
              <p className="text-3xl md:text-4xl font-serif text-foreground mb-2">0%</p>
              <p className="text-sm text-muted-foreground">Platform fees (first 3 bounties)</p>
            </div>
            <div className="p-6 md:p-7 rounded-2xl bg-card border border-border">
              <p className="text-3xl md:text-4xl font-serif text-foreground mb-2">Tokens</p>
              <p className="text-sm text-muted-foreground">Governance allocation</p>
            </div>
            <div className="p-6 md:p-7 rounded-2xl bg-card border border-border">
              <p className="text-3xl md:text-4xl font-serif text-foreground mb-2">Priority</p>
              <p className="text-sm text-muted-foreground">Direct team support</p>
            </div>
          </div>

          <Link href="/signup">
            <Button size="lg" className="rounded-full px-10 h-14 text-base font-semibold shadow-lg hover:shadow-xl">
              Apply Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <Link href="/" className="flex items-center">
              <SciFlowLogo size="md" showText={true} />
            </Link>

            <div className="flex items-center gap-6 md:gap-8 text-sm text-muted-foreground">
              <Link href="/docs" className="hover:text-foreground transition-colors font-medium">Docs</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors font-medium">FAQ</Link>
              <Link href="/whitepaper" className="hover:text-foreground transition-colors font-medium">Whitepaper</Link>
              <Link href="/help" className="hover:text-foreground transition-colors font-medium">Help</Link>
            </div>

            <p className="text-sm text-muted-foreground/70">
              © 2026 SciFlow
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
