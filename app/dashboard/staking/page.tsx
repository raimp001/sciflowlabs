"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Shield, ArrowUpCircle, ArrowDownCircle, Wallet, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"

export default function StakingPage() {
  const { lab, refreshUser } = useAuth()
  const [stakeAmount, setStakeAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [transactions, setTransactions] = useState<Array<{
    id: string
    type: string
    amount: number
    balance_after: number
    created_at: string
  }>>([])

  const currentStake = lab?.staking_balance || 0
  const lockedStake = lab?.locked_stake || 0
  const availableStake = currentStake - lockedStake

  // Fetch recent staking transactions
  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch("/api/staking")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch {
      // Non-critical - UI still works
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleDeposit = async () => {
    const amount = parseFloat(stakeAmount)
    if (!amount || amount <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid amount" })
      return
    }

    setIsDepositing(true)
    setFeedback(null)

    try {
      const response = await fetch("/api/staking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Deposit failed")
      }

      setFeedback({ type: "success", message: `Successfully deposited $${amount.toLocaleString()} USDC` })
      setStakeAmount("")
      await refreshUser()
      await fetchTransactions()
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Deposit failed" })
    } finally {
      setIsDepositing(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(stakeAmount)
    if (!amount || amount <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid amount" })
      return
    }

    if (amount > availableStake) {
      setFeedback({ type: "error", message: `Maximum withdrawable amount is $${availableStake.toLocaleString()} USDC` })
      return
    }

    setIsWithdrawing(true)
    setFeedback(null)

    try {
      const response = await fetch("/api/staking/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Withdrawal failed")
      }

      setFeedback({ type: "success", message: `Successfully withdrew $${amount.toLocaleString()} USDC` })
      setStakeAmount("")
      await refreshUser()
      await fetchTransactions()
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Withdrawal failed" })
    } finally {
      setIsWithdrawing(false)
    }
  }

  // Determine verification tier based on staking balance
  const getTierInfo = () => {
    if (currentStake >= 100000) return { tier: "Institutional", color: "bg-blue-500/20 text-blue-400" }
    if (currentStake >= 50000) return { tier: "Trusted", color: "bg-emerald-500/20 text-emerald-400" }
    if (currentStake >= 10000) return { tier: "Verified", color: "bg-amber-500/20 text-amber-400" }
    if (currentStake >= 1000) return { tier: "Basic", color: "bg-secondary text-muted-foreground" }
    return { tier: "Unverified", color: "bg-secondary text-muted-foreground" }
  }

  const tierInfo = getTierInfo()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-serif text-foreground">Staking</h1>
        <p className="text-sm text-muted-foreground">Manage your stake for lab verification</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Your Stake</p>
                <p className="text-2xl font-semibold text-foreground">${currentStake.toLocaleString()}</p>
                {lockedStake > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ${lockedStake.toLocaleString()} locked in proposals
                  </p>
                )}
              </div>
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Available</p>
                <p className="text-2xl font-semibold text-foreground">
                  ${availableStake.toLocaleString()}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Verification Tier</p>
                <Badge className={`${tierInfo.color} mt-1`}>{tierInfo.tier}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
          feedback.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
        }`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Actions */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <h3 className="font-medium text-foreground mb-4">Manage Stake</h3>
          <div className="flex gap-3 mb-4">
            <Input
              type="number"
              placeholder="Amount (USDC)"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="bg-secondary border-border text-foreground"
              disabled={isDepositing || isWithdrawing}
            />
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={handleDeposit}
              disabled={isDepositing || isWithdrawing || !stakeAmount}
            >
              {isDepositing ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <ArrowUpCircle className="w-4 h-4 mr-1.5" />
              )}
              Deposit
            </Button>
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-secondary"
              onClick={handleWithdraw}
              disabled={isDepositing || isWithdrawing || !stakeAmount || availableStake <= 0}
            >
              {isWithdrawing ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <ArrowDownCircle className="w-4 h-4 mr-1.5" />
              )}
              Withdraw
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Staking increases your verification tier and enables you to participate in bounty proposals.
            Minimum stake for Verified tier: $10,000 USDC. Locked stakes cannot be withdrawn until proposals resolve.
          </p>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <h3 className="font-medium text-foreground mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-xs ${
                      tx.type === "deposit" ? "text-emerald-500 border-emerald-500/30" :
                      tx.type === "withdrawal" ? "text-blue-500 border-blue-500/30" :
                      tx.type === "slash" ? "text-red-500 border-red-500/30" :
                      "text-muted-foreground"
                    }`}>
                      {tx.type}
                    </Badge>
                    <span className="text-sm text-foreground">
                      {tx.type === "deposit" ? "+" : "-"}${Math.abs(tx.amount).toLocaleString()} USDC
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
