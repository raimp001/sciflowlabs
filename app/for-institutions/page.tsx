"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, CheckCircle, Building2, Globe, FlaskConical, Users, Shield, Banknote } from "lucide-react"
import { toast } from "sonner"

const USE_CASES = [
  {
    org: "Pharmaceutical Companies",
    icon: FlaskConical,
    problems: [
      "Commission independent biomarker validation before Phase II investment",
      "Run competitive RFPs for toxicology studies across 10+ CROs simultaneously",
      "Fund open-ended exploration bounties for novel MOA discovery",
      "Validate competitor claims with independent replication studies",
    ],
    example: '"Validate efficacy of compound X in murine glioblastoma model. $120K, 3 milestones, trusted-tier labs only."',
  },
  {
    org: "Government Agencies",
    icon: Globe,
    problems: [
      "Post open RFPs with full transparency — any verified lab worldwide can bid",
      "Structured milestone payments replace slow bureaucratic disbursements",
      "All deliverables hashed on IPFS — permanent audit trail for grant management",
      "Integrate with existing grant systems via API (SAP, Banner, Coeus)",
    ],
    example: '"NIH-style open challenge: novel antibiotic mechanisms against gram-negative bacteria. $500K pooled from 3 agencies."',
  },
  {
    org: "Universities & Tech Transfer",
    icon: Building2,
    problems: [
      "Commercialize faculty IP by posting validation bounties to external labs",
      "Fund replication studies that validate publishable findings",
      "Create sponsored research agreements directly on-platform",
      "Generate revenue for the institution from successful bounty outcomes",
    ],
    example: '"Replicate and extend our proteomics findings in 3 independent cell lines. $45K, 60-day timeline."',
  },
  {
    org: "Foundations & Patient Groups",
    icon: Users,
    problems: [
      "Post disease-specific bounties that any qualified lab globally can apply for",
      "Set up recurring research programs with annual bounty cycles",
      "Quadratic funding pools — small donor contributions matched by foundation",
      "Full transparency: donors see exactly which milestones their funds unlocked",
    ],
    example: '"Alzheimer\'s Association: $200K pool for tau clearance mechanism studies. 8 milestones, institutional labs only."',
  },
]

const PAYMENT_OPTIONS = [
  {
    method: "Wire Transfer",
    icon: Banknote,
    desc: "Send via SWIFT / ACH. We generate an invoice for your AP department with PO reference.",
    suitable: "Pharma, Government, Universities",
  },
  {
    method: "Credit / Corporate Card",
    icon: Shield,
    desc: "Stripe-powered. Instant funding. Works with corporate purchasing cards.",
    suitable: "Foundations, Startups, Individuals",
  },
  {
    method: "USDC on Base",
    icon: Globe,
    desc: "Stablecoin deposit directly to escrow. Instant, borderless, fully auditable on-chain.",
    suitable: "Web3 DAOs, Biotech, Any funder",
  },
  {
    method: "Pooled / Consortium",
    icon: Users,
    desc: "Multiple funders contribute to a single bounty. Each funder's share is tracked separately.",
    suitable: "Consortiums, Co-funded grants",
  },
]

const COMPLIANCE = [
  "Generate PDF invoices with line-item milestone breakdown",
  "PO number reference field for procurement systems",
  "IRS-compliant transaction records for grant accounting",
  "IRB / ethics approval milestone requirement built into bounty structure",
  "IP assignment framework — choose open, licensed, or exclusive",
  "NDA execution before lab sees full bounty specification",
  "Full data export (CSV) for grant management software",
  "API access for integration with SAP, Oracle, or custom ERP",
]

export default function ForInstitutionsPage() {
  const [formData, setFormData] = useState({
    name: "", org: "", role: "", email: "", type: "", budget: "", message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/for-institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Submission failed')
      setSubmitted(true)
      toast.success("We'll be in touch within 24 hours")
    } catch {
      toast.error("Something went wrong. Email us at support@sciflowlabs.com")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background text-foreground">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">For Institutions</p>
        <h1 className="text-4xl md:text-5xl text-foreground mb-6 tracking-tight">
          Enterprise-grade research procurement
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          SciFlow gives pharma, governments, universities, and foundations the infrastructure
          to commission research globally — with competitive bidding, milestone escrow,
          and audit trails that compliance teams actually like.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#contact">
            <Button size="lg" className="rounded-full px-8 h-12 gap-2">
              Schedule a call <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12">
              Start posting bounties
            </Button>
          </Link>
        </div>
      </section>

      {/* Use cases by org type */}
      <section className="border-t border-border/30 py-24">
        <div className="max-w-5xl mx-auto px-6 space-y-16">
          {USE_CASES.map(({ org, icon: Icon, problems, example }) => (
            <div key={org} className="grid md:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-xl font-medium text-foreground">{org}</h2>
                </div>
                <ul className="space-y-2.5">
                  {problems.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-secondary/20 border border-border/40 rounded-xl p-5">
                <p className="text-xs text-muted-foreground/60 mb-2 uppercase tracking-wider">Example bounty</p>
                <p className="text-sm text-muted-foreground italic leading-relaxed">{example}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Payment options */}
      <section className="border-t border-border/30 py-24 bg-card/30">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-3">Payment routes</p>
            <h2 className="text-3xl text-foreground tracking-tight">Your budget, your currency</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {PAYMENT_OPTIONS.map(({ method, icon: Icon, desc, suitable }) => (
              <div key={method} className="p-5 border border-border/40 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm text-foreground">{method}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{desc}</p>
                <p className="text-xs text-muted-foreground/60">Best for: {suitable}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance features */}
      <section className="border-t border-border/30 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-3">Compliance & procurement</p>
              <h2 className="text-3xl text-foreground tracking-tight mb-4">
                Built for institutional procurement
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Compliance, audit, and legal requirements are built into the platform —
                not bolted on. Finance teams, legal, and grant officers all have
                what they need without extra overhead.
              </p>
            </div>
            <div className="space-y-2.5">
              {COMPLIANCE.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact / inquiry form */}
      <section id="contact" className="border-t border-border/30 py-24 bg-card/30">
        <div className="max-w-xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-3">Get started</p>
            <h2 className="text-3xl text-foreground tracking-tight mb-3">Institutional inquiry</h2>
            <p className="text-muted-foreground text-sm">
              We'll set up your organization account, walk through compliance requirements,
              and help you post your first bounty.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <p className="font-medium text-foreground text-lg mb-2">Request received</p>
              <p className="text-muted-foreground text-sm">
                We'll reach out to {formData.email} within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Your name</label>
                  <Input placeholder="Dr. Jane Smith" required value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Role / title</label>
                  <Input placeholder="VP Research" value={formData.role}
                    onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Organization</label>
                <Input placeholder="Pfizer, NIH, Harvard, Gates Foundation…" required value={formData.org}
                  onChange={e => setFormData(p => ({ ...p, org: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Org type</label>
                  <select
                    className="w-full h-11 rounded-xl border border-border/60 bg-secondary/30 px-4 text-sm text-foreground"
                    value={formData.type}
                    onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                    required
                  >
                    <option value="">Select…</option>
                    <option>Pharmaceutical / Biotech</option>
                    <option>Government Agency</option>
                    <option>University / Academic</option>
                    <option>Foundation / NGO</option>
                    <option>Venture Capital</option>
                    <option>DAO / Web3 Organization</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Expected annual budget</label>
                  <select
                    className="w-full h-11 rounded-xl border border-border/60 bg-secondary/30 px-4 text-sm text-foreground"
                    value={formData.budget}
                    onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    <option>Under $50K</option>
                    <option>$50K – $250K</option>
                    <option>$250K – $1M</option>
                    <option>$1M – $10M</option>
                    <option>$10M+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Work email</label>
                <Input type="email" placeholder="you@institution.edu" required value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">What research problem do you want to fund?</label>
                <textarea
                  className="w-full h-24 rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm text-foreground resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent/50"
                  placeholder="Brief description of your research needs, existing bottlenecks, timeline…"
                  value={formData.message}
                  onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full rounded-xl h-12" disabled={loading}>
                {loading ? "Submitting…" : "Request institutional access"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                We respond within 24 hours. No commitment required.
              </p>
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-border/30 py-8">
        <p className="text-xs text-center text-muted-foreground/40">© 2026 SciFlow</p>
      </footer>
    </div>
  )
}
