"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  ArrowLeft,
  FileText,
  FlaskConical,
  Shield,
  Lock,
  Users,
  Wallet,
  Scale,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Zap,
  Download,
  ChevronDown,
  ChevronUp
} from "lucide-react"

const sections = [
  { id: "intro", num: "01", title: "Introduction & Problem Statement", icon: Zap },
  { id: "protocol", num: "02", title: "The SciFlow Protocol", icon: FlaskConical },
  { id: "state-machine", num: "03", title: "State Machine Architecture", icon: TrendingUp },
  { id: "payments", num: "04", title: "Hybrid Payment Infrastructure", icon: Wallet },
  { id: "por", num: "05", title: "Proof of Research (PoR)", icon: Shield },
  { id: "staking", num: "06", title: "Staking & Slashing Mechanics", icon: Lock },
  { id: "disputes", num: "07", title: "Dispute Resolution", icon: Scale },
  { id: "economics", num: "08", title: "Economic Model", icon: TrendingUp },
  { id: "implementation", num: "09", title: "Technical Implementation", icon: FileText },
  { id: "governance", num: "10", title: "Governance & Roadmap", icon: Users },
]

export default function WhitepaperPage() {
  const [activeSection, setActiveSection] = useState("intro")
  const [tocExpanded, setTocExpanded] = useState(true)

  useEffect(() => {
    const updateActiveFromHash = () => {
      const hash = window.location.hash.slice(1)
      if (hash && sections.find(s => s.id === hash)) {
        setActiveSection(hash)
      }
    }
    updateActiveFromHash()
    window.addEventListener("hashchange", updateActiveFromHash)
    return () => window.removeEventListener("hashchange", updateActiveFromHash)
  }, [])

  const handleDownloadPDF = () => {
    alert("PDF download will be available soon. The whitepaper content is displayed below.")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownloadPDF}
            className="border-border hover:bg-secondary rounded-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title Block */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
            <FileText className="w-3 h-3 mr-1" />
            Technical Whitepaper v1.0
          </Badge>
          <h1 className="text-4xl font-serif text-foreground mb-4">
            SciFlow Protocol
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            A Decentralized Research Bounty Marketplace with
            Milestone-Based Escrow and Proof of Research
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>January 2026</span>
            <span>•</span>
            <span>Version 1.0</span>
          </div>
        </div>

        {/* Abstract */}
        <Card className="border-border bg-card mb-10">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Abstract</h2>
            <p className="text-muted-foreground leading-relaxed">
              SciFlow introduces a novel approach to research funding through decentralized bounties, 
              combining milestone-based escrow with on-chain proof of research. By leveraging smart 
              contracts on Solana and Base networks alongside traditional payment rails via Stripe, 
              SciFlow creates a hybrid payment infrastructure that serves both crypto-native and 
              traditional funders. The protocol implements a state machine-driven workflow that 
              ensures accountability, prevents fraud through staking mechanisms, and provides 
              transparent dispute resolution.
            </p>
          </CardContent>
        </Card>

        {/* Table of Contents */}
        <nav className="mb-12 border border-border rounded-xl overflow-hidden">
          <button 
            onClick={() => setTocExpanded(!tocExpanded)}
            className="w-full flex items-center justify-between p-4 bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Table of Contents
            </span>
            {tocExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          
          {tocExpanded && (
            <ol className="divide-y divide-border">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary cursor-pointer ${
                      activeSection === section.id 
                        ? "bg-accent/10 border-l-2 border-accent" 
                        : ""
                    }`}
                  >
                    <span className={`font-mono text-sm ${
                      activeSection === section.id ? "text-accent" : "text-muted-foreground"
                    }`}>
                      {section.num}
                    </span>
                    <span className={`text-sm ${
                      activeSection === section.id 
                        ? "text-accent font-medium" 
                        : "text-muted-foreground"
                    }`}>
                      {section.title}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </nav>

        {/* Sections */}
        <article className="space-y-16">
          {/* Section 1 - Introduction */}
          <section id="intro" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-accent/20">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-xl font-serif text-foreground">
                1. Introduction & Problem Statement
              </h2>
            </div>
            <div className="text-muted-foreground space-y-4">
              <p>
                Traditional research funding suffers from significant inefficiencies: slow grant 
                processes, lack of accountability, and misaligned incentives between funders and 
                researchers. According to studies, up to 40% of funded research fails to produce 
                reproducible results, yet researchers face little consequence for these failures.
              </p>
              <p>
                The DeSci (Decentralized Science) movement has emerged to address these issues. 
                SciFlow provides a hybrid infrastructure that:
              </p>
              <ul className="space-y-2 ml-4">
                {[
                  "Connects funders directly with verified research labs",
                  "Implements milestone-based payments that align incentives",
                  "Creates immutable proof of research deliverables",
                  "Supports both fiat and cryptocurrency payments",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Section 2 - Protocol */}
          <section id="protocol" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <FlaskConical className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-serif text-foreground">
                2. The SciFlow Protocol
              </h2>
            </div>
            <div className="text-muted-foreground space-y-4">
              <p>
                SciFlow operates as a two-sided marketplace connecting <strong className="text-foreground">Funders</strong> 
                (research sponsors, DAOs, foundations, corporations) with <strong className="text-foreground">Labs</strong> 
                (verified research institutions, independent scientists, university labs).
              </p>
              
              <div className="grid md:grid-cols-2 gap-3 mt-6">
                {[
                  { icon: FileText, title: "Bounty Engine", desc: "Protocol definition, milestone specification, bidding system" },
                  { icon: Lock, title: "Escrow Layer", desc: "Multi-method fund custody (Stripe, Solana, Base)" },
                  { icon: Shield, title: "Verification System", desc: "Lab tiers, reputation scoring, KYC/KYB" },
                  { icon: Scale, title: "Dispute Resolution", desc: "3-stage arbitration with stake slashing" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3 p-4 bg-card rounded-lg border border-border">
                    <item.icon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.title}</p>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3 - State Machine */}
          <section id="state-machine" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-serif text-foreground">
                3. State Machine Architecture
              </h2>
            </div>
            <div className="text-muted-foreground space-y-4">
              <p>
                The bounty lifecycle is governed by a rigid state machine implemented using XState. 
                This ensures deterministic transitions and prevents invalid operations.
              </p>
              
              {/* State Diagram */}
              <div className="bg-secondary rounded-xl p-6 my-6 border border-border">
                <h4 className="font-semibold mb-4 text-sm text-foreground">Bounty State Transitions</h4>
                <div className="flex flex-wrap gap-2 items-center justify-center">
                  {[
                    { state: "Draft", color: "bg-secondary border border-border" },
                    { state: "Funding", color: "bg-amber-500/20 border border-amber-500/30 text-amber-400" },
                    { state: "Bidding", color: "bg-blue-500/20 border border-blue-500/30 text-blue-400" },
                    { state: "Research", color: "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" },
                    { state: "Review", color: "bg-orange-500/20 border border-orange-500/30 text-orange-400" },
                    { state: "Complete", color: "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" },
                  ].map((item, i) => (
                    <div key={item.state} className="flex items-center gap-1">
                      <span className={`px-3 py-1.5 rounded-full ${item.color} text-xs font-mono`}>
                        {item.state}
                      </span>
                      {i < 5 && <span className="text-muted-foreground text-xs">→</span>}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground text-center">
                  Dispute state can be entered from Research or Review stages
                </p>
              </div>

              <p>
                Each state transition is guarded by conditions that validate the current context. 
                For example, transitioning from funding to bidding requires confirmation that funds 
                have been secured in the escrow contract.
              </p>
            </div>
          </section>

          {/* Section 4 - Payments */}
          <section id="payments" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-accent/20">
                <Wallet className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-xl font-serif text-foreground">
                4. Hybrid Payment Infrastructure
              </h2>
            </div>
            <div className="text-muted-foreground space-y-4">
              <p>
                SciFlow supports three payment methods, each with its own escrow implementation:
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 my-6">
                {[
                  { name: "Stripe", desc: "PaymentIntent with manual capture", badge: "Fiat USD" },
                  { name: "Solana", desc: "Anchor program with PDA escrow", badge: "USDC SPL" },
                  { name: "Base", desc: "ERC20 escrow via CREATE2", badge: "USDC ERC20" },
                ].map((item) => (
                  <Card key={item.name} className="border-border bg-card">
                    <CardContent className="p-5 text-center">
                      <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-secondary flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h4 className="font-semibold text-foreground">{item.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                      <Badge variant="outline" className="mt-3 text-xs border-border">{item.badge}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Section 5 - Proof of Research */}
          <section id="por" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-serif text-foreground">
                5. Proof of Research (PoR)
              </h2>
            </div>
            <div className="text-muted-foreground space-y-4">
              <p>
                Every milestone submission includes cryptographic proof anchored on-chain:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Lab uploads evidence files (data, protocols, results) to IPFS/Arweave</li>
                <li>SHA-256 hash of the content is computed client-side</li>
                <li>Hash is submitted to the milestone evidence contract</li>
                <li>Funder reviews evidence via the content link</li>
                <li>Upon approval, hash is permanently recorded with block timestamp</li>
              </ol>
              <p>
                This creates an immutable, timestamped record of research deliverables that can 
                be independently verified by anyone with the content hash.
              </p>
            </div>
          </section>

          {/* Section 6 - Staking */}
          <section id="staking" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-accent/20">
                <Lock className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-xl font-serif text-foreground">
                6. Staking & Slashing Mechanics
              </h2>
            </div>
            <div className="text-muted-foreground space-y-4">
              <p>
                Labs must stake tokens proportional to the bounty value when submitting proposals. 
                This stake serves as collateral for good behavior.
              </p>
              
              <Card className="border-amber-500/30 bg-amber-500/10 my-6">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-400 mb-2">Slashing Conditions</h4>
                      <ul className="space-y-1 text-amber-300/80 text-sm">
                        <li>• Data falsification or fabrication</li>
                        <li>• Protocol deviation without approval</li>
                        <li>• Sample tampering or chain-of-custody violations</li>
                        <li>• Repeated missed deadlines without communication</li>
                        <li>• Abandonment of research project</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <p>
                Staking requirements vary by verification tier: Basic (10%), Verified (7%), 
                Trusted (5%), Institutional (3%).
              </p>
            </div>
          </section>

          {/* Section 7 - Disputes */}
          <section id="disputes" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Scale className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-serif text-foreground">
                7. Dispute Resolution
              </h2>
            </div>
            <div className="text-muted-foreground space-y-4">
              <p>
                Disputes are handled through a three-stage process:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li><strong className="text-foreground">Negotiation (7 days)</strong> - Direct communication between parties</li>
                <li><strong className="text-foreground">Mediation (14 days)</strong> - Platform-facilitated resolution</li>
                <li><strong className="text-foreground">Arbitration (21 days)</strong> - Binding decision by expert panel</li>
              </ol>
              <p>
                Arbitrators are selected from a pool of verified domain experts who stake tokens 
                to participate. Their decisions can result in full or partial fund release, 
                stake slashing, or bounty cancellation with refund.
              </p>
            </div>
          </section>

          {/* Section 8 - Economics */}
          <section id="economics" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-serif text-foreground">
                8. Economic Model
              </h2>
            </div>
            <div className="text-muted-foreground space-y-4">
              <p>
                SciFlow charges a 2.5% platform fee on successful bounty completions. Fee structure:
              </p>
              <ul className="space-y-2 ml-4">
                <li>• 1.5% to platform treasury for operations</li>
                <li>• 0.5% to staking rewards pool</li>
                <li>• 0.5% to dispute resolution reserve</li>
              </ul>
              <p>
                Labs receive 97.5% of the bounty value upon milestone approvals. Funders pay 
                the full bounty amount plus any applicable payment processor fees.
              </p>
            </div>
          </section>

          {/* Section 9 - Implementation */}
          <section id="implementation" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-secondary">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-serif text-foreground">
                9. Technical Implementation
              </h2>
            </div>
            <div className="text-muted-foreground space-y-4">
              <p>
                SciFlow is built on a modern tech stack:
              </p>
              <ul className="space-y-2 ml-4">
                <li>• <strong className="text-foreground">Frontend:</strong> Next.js 16, React, Tailwind CSS</li>
                <li>• <strong className="text-foreground">State Machine:</strong> XState for bounty lifecycle management</li>
                <li>• <strong className="text-foreground">Backend:</strong> Supabase (PostgreSQL) with Row-Level Security</li>
                <li>• <strong className="text-foreground">Blockchain:</strong> Solana (Anchor) and Base (Solidity)</li>
                <li>• <strong className="text-foreground">Storage:</strong> IPFS/Arweave for evidence files</li>
              </ul>
            </div>
          </section>

          {/* Section 10 - Governance */}
          <section id="governance" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-serif text-foreground">
                10. Governance & Roadmap
              </h2>
            </div>
            <div className="text-muted-foreground space-y-4">
              <p>
                SciFlow will progressively decentralize governance through a DAO structure:
              </p>
              <ul className="space-y-2 ml-4">
                <li>• <strong className="text-foreground">Q1 2026:</strong> Platform launch with centralized operations</li>
                <li>• <strong className="text-foreground">Q2 2026:</strong> Introduce staking and reputation system</li>
                <li>• <strong className="text-foreground">Q3 2026:</strong> Launch arbitrator network</li>
                <li>• <strong className="text-foreground">Q4 2026:</strong> Transition to DAO governance</li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <Card className="bg-accent/10 border-accent/20 rounded-xl">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-serif text-foreground mb-3">Ready to fund your first bounty?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Join SciFlow to fund breakthrough research or offer your lab&apos;s expertise.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/signup">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-full">
                    Sign Up Now
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button 
                    variant="outline" 
                    className="border-border text-foreground hover:bg-secondary rounded-full"
                  >
                    Browse Bounties
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </article>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path 
                d="M9 3V11L5 19C4.5 20 5 21 6 21H18C19 21 19.5 20 19 19L15 11V3" 
                stroke="hsl(20, 70%, 55%)"
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path d="M9 3H15" stroke="hsl(20, 70%, 55%)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="font-medium text-foreground">SciFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 SciFlow Protocol. Licensed under MIT.
          </p>
        </div>
      </footer>
    </div>
  )
}
