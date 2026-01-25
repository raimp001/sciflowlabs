import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, FlaskConical, Shield, Wallet } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <path 
                  d="M9 3V11L5 19C4.5 20 5 21 6 21H18C19 21 19.5 20 19 19L15 11V3" 
                  stroke="url(#g)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path d="M9 3H15" stroke="url(#g)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="11" cy="15" r="1" fill="#34D399" />
                <circle cx="14" cy="16" r="0.8" fill="#6EE7B7" />
                <defs>
                  <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-xl font-semibold text-white">
              Sci<span className="text-amber-400">Flow</span>
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Fund Research.<br />
            <span className="text-amber-400">Deliver Results.</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Connect funders with verified labs through milestone-based bounties. 
            Secure escrow. Transparent accountability.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium">
                Launch App
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/whitepaper">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Read Whitepaper
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Link 
            href="/dashboard/labs" 
            className="group p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 transition-all duration-200 cursor-pointer"
          >
            <FlaskConical className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">Verified Labs</h3>
            <p className="text-sm text-slate-400">
              Reputation-scored labs with staking requirements ensure quality research delivery.
            </p>
            <span className="inline-flex items-center text-xs text-emerald-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Browse Labs <ArrowRight className="w-3 h-3 ml-1" />
            </span>
          </Link>

          <Link 
            href="/dashboard/escrow" 
            className="group p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-800 transition-all duration-200 cursor-pointer"
          >
            <Wallet className="w-8 h-8 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">Hybrid Payments</h3>
            <p className="text-sm text-slate-400">
              Pay via Stripe or crypto (Solana/Base USDC). All funds held in secure escrow.
            </p>
            <span className="inline-flex items-center text-xs text-amber-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              View Escrow <ArrowRight className="w-3 h-3 ml-1" />
            </span>
          </Link>

          <Link 
            href="/whitepaper#por" 
            className="group p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-200 cursor-pointer"
          >
            <Shield className="w-8 h-8 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">Milestone Escrow</h3>
            <p className="text-sm text-slate-400">
              Funds release only on verified milestone completion with dispute resolution.
            </p>
            <span className="inline-flex items-center text-xs text-blue-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Learn More <ArrowRight className="w-3 h-3 ml-1" />
            </span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-sm text-slate-500">
          <span>© 2026 SciFlow</span>
          <div className="flex gap-6">
            <Link href="/whitepaper" className="hover:text-slate-300">Whitepaper</Link>
            <Link href="/help" className="hover:text-slate-300">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
