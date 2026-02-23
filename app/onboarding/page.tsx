"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Loader2, Building2, FlaskConical, CheckCircle } from "lucide-react"
import { toast } from "sonner"

const ROLES = [
  {
    id: "funder",
    icon: Building2,
    title: "I want to fund research",
    subtitle: "Post research questions and pay labs only when they deliver results",
    who: "Pharma companies · Governments · Universities · Foundations · VCs · Individuals",
    color: "border-blue-500/30 hover:border-blue-400/60 data-[selected=true]:border-blue-400 data-[selected=true]:bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    id: "lab",
    icon: FlaskConical,
    title: "I am a researcher / lab",
    subtitle: "Find funded research projects and get paid milestone by milestone",
    who: "Research labs · Academic institutions · Independent scientists · CROs",
    color: "border-emerald-500/30 hover:border-emerald-400/60 data-[selected=true]:border-emerald-400 data-[selected=true]:bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [selected, setSelected] = useState<"funder" | "lab" | null>(null)
  const [saving, setSaving] = useState(false)

  const handleContinue = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selected, onboarding_completed: true }),
      })
      if (!res.ok) throw new Error('Failed to save')
      await refreshUser()
      toast.success("Welcome to SciFlow!")
      router.replace('/dashboard')
    } catch {
      toast.error("Something went wrong — please try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-lg font-bold text-accent">S</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome to SciFlow</h1>
          <p className="text-muted-foreground">
            What best describes you? We'll set up your workspace accordingly.
          </p>
        </div>

        {/* Role selection */}
        <div className="space-y-3">
          {ROLES.map(role => {
            const isSelected = selected === role.id
            const Icon = role.icon
            return (
              <button
                key={role.id}
                data-selected={isSelected}
                onClick={() => setSelected(role.id as "funder" | "lab")}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-150 ${role.color}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 shrink-0 ${role.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{role.title}</p>
                      {isSelected && <CheckCircle className="w-4 h-4 text-foreground shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{role.subtitle}</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">{role.who}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Continue */}
        <Button
          className="w-full h-12 rounded-xl text-base"
          disabled={!selected || saving}
          onClick={handleContinue}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Setting up your workspace…</>
          ) : (
            'Continue →'
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          You can change this later in Settings.
        </p>
      </div>
    </div>
  )
}
