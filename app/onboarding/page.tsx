"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Building2, FlaskConical, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

const ROLES = [
  {
    id: "funder",
    icon: Building2,
    title: "I want to fund research",
    subtitle: "Post research questions and pay labs only when they deliver results",
    who: "Pharma companies \u00b7 Governments \u00b7 Universities \u00b7 Foundations \u00b7 VCs \u00b7 Individuals",
    color: "border-blue-500/30 hover:border-blue-400/60 data-[selected=true]:border-blue-400 data-[selected=true]:bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    id: "lab",
    icon: FlaskConical,
    title: "I am a researcher / lab",
    subtitle: "Find funded research projects and get paid milestone by milestone",
    who: "Research labs \u00b7 Academic institutions \u00b7 Independent scientists \u00b7 CROs",
    color: "border-emerald-500/30 hover:border-emerald-400/60 data-[selected=true]:border-emerald-400 data-[selected=true]:bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
]

export default function OnboardingPage() {
  const [selected, setSelected] = useState<"funder" | "lab" | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { refreshUser } = useAuth()

  const handleContinue = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selected, onboarding_completed: true }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const errorMsg = data?.error || `Server error (${res.status})`
        console.error('[Onboarding] PATCH failed:', errorMsg)
        toast.error(`Something went wrong \u2014 ${errorMsg}`)
        setSaving(false)
        return
      }
      // Await refreshUser so auth context has onboarding_completed=true before navigation
      await refreshUser().catch(() => {})
      toast.success("Welcome to SciFlow!")
      // Use Next.js router so auth context stays mounted
      router.push('/dashboard')
    } catch (err) {
      console.error('[Onboarding] Unexpected error:', err)
      toast.error("Something went wrong \u2014 please try again")
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-4">
          S
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to SciFlow</h1>
        <p className="text-muted-foreground mt-2">What best describes you? We'll set up your workspace accordingly.</p>
      </div>

      {/* Role selection */}
      <div className="w-full max-w-lg space-y-3 mb-6">
        {ROLES.map(role => {
          const isSelected = selected === role.id
          const Icon = role.icon
          return (
            <button
              key={role.id}
              onClick={() => setSelected(role.id as "funder" | "lab")}
              data-selected={isSelected}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-150 ${role.color}`}
            >
              <div className="flex items-start gap-4">
                <Icon className={`w-6 h-6 mt-0.5 shrink-0 ${role.iconColor}`} />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{role.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{role.subtitle}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1.5">{role.who}</p>
                </div>
                {isSelected && <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Continue */}
      <Button
        onClick={handleContinue}
        disabled={!selected || saving}
        className="w-full max-w-lg h-12 rounded-2xl text-base font-semibold"
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting up your workspace…</>
        ) : (
          'Continue →'
        )}
      </Button>

      <p className="text-xs text-muted-foreground mt-4">You can change this later in Settings.</p>
    </div>
  )
}
