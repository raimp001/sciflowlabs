import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-28 pb-32 text-center">
        <h1 className="heading-display text-5xl md:text-7xl text-foreground mb-8">
          Fund research.<br />
          <span className="text-muted-foreground/50">Pay on proof.</span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-12">
          Post a bounty. Verified labs compete. 
          Funds release only when results are proven.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="rounded-full px-8 h-12">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/dashboard/open-bounties">
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12">
              Browse
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/30 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-16 text-center">How it works</p>
          
          <div className="grid md:grid-cols-4 gap-12 md:gap-8">
            {[
              { n: "01", title: "Post", desc: "Describe your research question and set a budget." },
              { n: "02", title: "Compete", desc: "Verified labs submit proposals. You pick the best." },
              { n: "03", title: "Prove", desc: "Labs deliver evidence at each milestone." },
              { n: "04", title: "Pay", desc: "Funds release only on verified proof." },
            ].map((s) => (
              <div key={s.n}>
                <p className="text-xs text-muted-foreground/40 font-mono mb-3">{s.n}</p>
                <h3 className="text-foreground font-medium mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Labs */}
      <section className="border-t border-border/30 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">For researchers</p>
              <h2 className="text-3xl md:text-4xl text-foreground mb-4 tracking-tight">
                Get paid for your expertise
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Browse funded projects. Submit your methodology. 
                Deliver results and get paid instantly.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: "Verification tiers", desc: "Basic, Verified, Trusted, Institutional" },
                { label: "On-chain escrow", desc: "Funds held securely until milestones verified" },
                { label: "IPFS evidence", desc: "Tamper-proof research data storage" },
              ].map((item) => (
                <div key={item.label} className="py-4 border-b border-border/30 last:border-0">
                  <p className="text-foreground font-medium text-sm">{item.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/30 py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 text-sm text-muted-foreground mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Early access
          </div>
          <h2 className="text-3xl md:text-4xl text-foreground mb-4 tracking-tight">
            Join the founding cohort
          </h2>
          <p className="text-muted-foreground mb-10">
            0% fees on your first 3 bounties. Governance tokens. Priority support.
          </p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-8 h-12">
              Apply Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <p className="text-xs text-center text-muted-foreground/40">
          © 2026 SciFlow
        </p>
      </footer>
    </div>
  )
}
