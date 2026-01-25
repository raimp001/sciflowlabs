"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  FlaskConical, 
  Send, 
  Clock, 
  Plus, 
  Building2, 
  Bell, 
  Shield, 
  Wallet, 
  CheckCircle2,
  ArrowRight,
  Microscope,
  Brain,
  Dna,
  Atom,
  Leaf,
  Heart,
  FileText,
  ExternalLink,
  Sparkles,
  Calendar,
  Users,
  DollarSign,
  TrendingUp
} from "lucide-react"
import { useBounties } from "@/hooks/use-bounties"
import { useState } from "react"
import Link from "next/link"

function formatCurrency(amount: number, currency: string) {
  return currency === "USD" ? `$${amount.toLocaleString()}` : `${amount.toLocaleString()} ${currency}`
}

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// Example bounties to show new users what to expect
const exampleBounties = [
  {
    id: "example-1",
    title: "CRISPR Gene Editing Optimization for Rare Disease Therapy",
    description: "Seeking lab to optimize CRISPR-Cas9 delivery mechanisms for treating Duchenne muscular dystrophy. Must include in-vitro validation.",
    budget: 75000,
    currency: "USD",
    deadline: "45 days",
    field: "Genetics",
    milestones: 4,
  },
  {
    id: "example-2", 
    title: "AI-Driven Drug Discovery for Antibiotic Resistance",
    description: "Research partnership to develop ML models predicting novel antibiotic compounds effective against MRSA strains.",
    budget: 120000,
    currency: "USDC",
    deadline: "90 days",
    field: "AI/ML",
    milestones: 5,
  },
  {
    id: "example-3",
    title: "Sustainable Bioplastic Synthesis from Agricultural Waste",
    description: "Lab-scale synthesis and characterization of biodegradable polymers using cellulose from crop residues.",
    budget: 45000,
    currency: "USD",
    deadline: "60 days",
    field: "Materials",
    milestones: 3,
  },
]

// Research focus areas
const focusAreas = [
  { name: "Oncology", icon: Microscope, count: 0, description: "Cancer research and therapeutics" },
  { name: "AI/ML", icon: Brain, count: 0, description: "Machine learning in life sciences" },
  { name: "Genomics", icon: Dna, count: 0, description: "Gene editing and sequencing" },
  { name: "Materials", icon: Atom, count: 0, description: "Novel materials and polymers" },
  { name: "Sustainability", icon: Leaf, count: 0, description: "Green chemistry and biotech" },
  { name: "Therapeutics", icon: Heart, count: 0, description: "Drug discovery and delivery" },
]

// Upcoming bounties preview
const upcomingBounties = [
  { theme: "Precision Medicine", timeline: "February 2026", status: "Funding confirmed" },
  { theme: "Carbon Capture Biotech", timeline: "Q1 2026", status: "In preparation" },
  { theme: "Neurodegenerative Disease", timeline: "March 2026", status: "Partner confirmed" },
]

export default function OpenBountiesPage() {
  const [search, setSearch] = useState("")
  const [notifyEmail, setNotifyEmail] = useState("")
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const { bounties, isLoading, error } = useBounties({ 
    state: "bidding",
    search: search || undefined 
  })

  const hasRealBounties = bounties.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Open Bounties</h1>
          <p className="text-sm text-slate-500">Browse and submit proposals for available research bounties</p>
        </div>
        
        {/* Segmented CTAs */}
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/bounties">
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <Plus className="w-4 h-4 mr-1.5" />
              Post a Bounty
            </Button>
          </Link>
          <Link href="/dashboard/labs">
            <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              <Building2 className="w-4 h-4 mr-1.5" />
              Apply as Lab
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search bounties by topic, method, or field..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 border-slate-200"
        />
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-9 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasRealBounties ? (
        /* Real bounties list */
        <div className="space-y-3">
          {bounties.map((bounty) => (
            <Card key={bounty.id} className="border-slate-200 hover:border-slate-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-1">{bounty.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{bounty.description}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 whitespace-nowrap">
                    Open for Bids
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="font-medium text-slate-900">
                      {formatCurrency(bounty.total_budget || 0, bounty.currency || "USD")}
                    </span>
                    {bounty.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {daysUntil(bounty.deadline)} days left
                      </span>
                    )}
                  </div>
                  <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Submit Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Enhanced empty state */
        <div className="space-y-8">
          
          {/* Purposeful empty state message */}
          <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <FlaskConical className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No Open Bounties Yet</h2>
              <p className="text-slate-600 max-w-md mx-auto mb-4">
                Bounties are posted by funders seeking specific research outcomes. New opportunities are 
                added weekly as partners finalize their research needs.
              </p>
              <p className="text-sm text-slate-500">
                <span className="font-medium">💡 Tip:</span> Set up notifications below to be first to know when a bounty matches your expertise.
              </p>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                How SciFlow Bounties Work
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Submit Proposal</p>
                    <p className="text-xs text-slate-500">Review bounty requirements and submit your approach, timeline, and credentials.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Complete Milestones</p>
                    <p className="text-xs text-slate-500">Work is divided into milestones. Funds release as each milestone is verified.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-emerald-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Get Paid Securely</p>
                    <p className="text-xs text-slate-500">Payments via Stripe or USDC from escrow. Dispute resolution if needed.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example bounties */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Example Bounties
              </h3>
              <Badge variant="outline" className="text-slate-500 border-slate-300">
                Sample Format
              </Badge>
            </div>
            <div className="space-y-3">
              {exampleBounties.map((bounty) => (
                <Card key={bounty.id} className="border-dashed border-slate-300 bg-slate-50/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-700">{bounty.title}</h4>
                          <Badge variant="outline" className="text-xs text-slate-400 border-slate-200">
                            Example
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2">{bounty.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="font-medium text-slate-700">
                        ${bounty.budget.toLocaleString()} {bounty.currency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {bounty.deadline}
                      </span>
                      <Badge className="bg-slate-100 text-slate-600">{bounty.field}</Badge>
                      <span className="text-slate-400">{bounty.milestones} milestones</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Two-column layout for secondary content */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Left column - Focus areas and upcoming */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Focus areas discovery */}
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Research Focus Areas</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Browse fields we&apos;re actively sourcing bounties for. Click to get notified when opportunities open.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {focusAreas.map((area) => (
                      <button
                        key={area.name}
                        onClick={() => setSelectedField(selectedField === area.name ? null : area.name)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedField === area.name
                            ? "border-amber-400 bg-amber-50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <area.icon className={`w-5 h-5 mb-2 ${
                          selectedField === area.name ? "text-amber-600" : "text-slate-400"
                        }`} />
                        <p className="font-medium text-sm text-slate-900">{area.name}</p>
                        <p className="text-xs text-slate-500">{area.description}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming bounties roadmap */}
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    Upcoming Bounties
                  </h3>
                  <div className="space-y-3">
                    {upcomingBounties.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{item.theme}</p>
                          <p className="text-xs text-slate-500">{item.timeline}</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column - Trust, notifications, social proof */}
            <div className="space-y-6">
              
              {/* Trust indicators */}
              <Card className="border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Platform Guarantees
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Escrow-protected funds until milestone completion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Verified lab credentials and reputation scores</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Crypto (USDC) and fiat (Stripe) support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Independent dispute resolution</span>
                    </li>
                  </ul>
                  <Link href="/whitepaper#por" className="mt-4 flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300">
                    Learn about Proof of Research
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardContent>
              </Card>

              {/* Notification signup */}
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-600" />
                    Get Notified
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Be first to know when bounties open
                    {selectedField && <span className="font-medium"> in {selectedField}</span>}.
                  </p>
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      className="bg-white border-amber-200"
                    />
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                      Subscribe to Updates
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Social proof */}
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-400" />
                    Platform Traction
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        Labs Pre-registered
                      </span>
                      <span className="font-bold text-slate-900">87</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        Funders Onboarded
                      </span>
                      <span className="font-bold text-slate-900">23</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-500" />
                        Funding Committed
                      </span>
                      <span className="font-bold text-slate-900">$340K</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Developer links */}
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-3">For Developers</h3>
                  <div className="space-y-2">
                    <Link 
                      href="/whitepaper" 
                      className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm text-slate-600 hover:text-slate-900"
                    >
                      <span>Technical Whitepaper</span>
                      <FileText className="w-4 h-4" />
                    </Link>
                    <a 
                      href="https://github.com/sciflowlabs" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm text-slate-600 hover:text-slate-900"
                    >
                      <span>GitHub Repository</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <Link 
                      href="/whitepaper#state-machine" 
                      className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm text-slate-600 hover:text-slate-900"
                    >
                      <span>State Machine Docs</span>
                      <FileText className="w-4 h-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
