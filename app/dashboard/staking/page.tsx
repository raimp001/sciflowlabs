"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Shield, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

export default function StakingPage() {
  const { lab } = useAuth()
  const [stakeAmount, setStakeAmount] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [stakingPool, setStakingPool] = useState<{ total_staked: number; apy: number } | null>(null)

  useEffect(() => {
    async function fetchStakingData() {
      try {
        const supabase = createClient()
        if (!supabase) return

        const { data } = await supabase
          .from('staking_pool')
          .select('*')
          .limit(1)
          .single()

        if (data) setStakingPool(data)
      } catch {
        // Staking pool might not exist yet
      } finally {
        setIsLoading(false)
      }
    }
    fetchStakingData()
  }, [])

  const currentStake = lab?.staked_amount || 0

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Staking</h1>
        <p className="text-sm text-slate-500">Manage your stake for lab verification</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-40" />
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-40" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Your Stake</p>
                    <p className="text-2xl font-semibold text-slate-900">${currentStake.toLocaleString()}</p>
                  </div>
                  <Shield className="w-8 h-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Total Pool</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      ${(stakingPool?.total_staked || 0).toLocaleString()}
                    </p>
                  </div>
                  <Wallet className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Est. APY</p>
                    <p className="text-2xl font-semibold text-emerald-600">
                      {stakingPool?.apy || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <h3 className="font-medium text-slate-900 dark:text-white mb-4">Manage Stake</h3>
              <div className="flex gap-3 mb-4">
                <Input
                  type="number"
                  placeholder="Amount (USDC)"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="border-slate-200"
                />
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  <ArrowUpCircle className="w-4 h-4 mr-1.5" />
                  Deposit
                </Button>
                <Button variant="outline" className="border-slate-200">
                  <ArrowDownCircle className="w-4 h-4 mr-1.5" />
                  Withdraw
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                Staking increases your verification tier and enables you to participate in disputes.
                Minimum stake for Verified tier: $10,000 USDC
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
