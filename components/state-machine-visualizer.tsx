"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { stateMetadata, type BountyState } from '@/lib/machines/bounty-machine'
import {
  FileEdit, FileCheck, Wallet, Lock, Users, FlaskConical,
  ClipboardCheck, AlertTriangle, Scale, Split, CircleDollarSign,
  CheckCircle2, Undo2, XCircle, ArrowRight, ChevronRight,
  Shield, ShieldX, PenLine, Clock, TimerOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileEdit,
  FileCheck,
  Wallet,
  Lock,
  Users,
  FlaskConical,
  ClipboardCheck,
  AlertTriangle,
  Scale,
  Split,
  CircleDollarSign,
  CheckCircle2,
  Undo2,
  XCircle,
  Shield,
  ShieldX,
  PenLine,
  Clock,
  TimerOff,
}

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  slate: { bg: 'bg-charcoal-100 dark:bg-charcoal-800', border: 'border-charcoal-300', text: 'text-charcoal-700' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-300', text: 'text-amber-700' },
  coral: { bg: 'bg-coral-100 dark:bg-coral-900/30', border: 'border-coral-300', text: 'text-coral-700' },
  navy: { bg: 'bg-charcoal-100 dark:bg-charcoal-800', border: 'border-charcoal-300', text: 'text-charcoal-700' },
  sage: { bg: 'bg-sage-100 dark:bg-sage-900/30', border: 'border-sage-300', text: 'text-sage-700' },
  destructive: { bg: 'bg-alert-100 dark:bg-alert-900/30', border: 'border-alert-300', text: 'text-alert-600' },
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-300', text: 'text-amber-700' },
}

interface StateNodeProps {
  state: BountyState
  isActive?: boolean
  isCompleted?: boolean
  isCurrent?: boolean
  onClick?: () => void
}

function StateNode({ state, isActive, isCompleted, isCurrent, onClick }: StateNodeProps) {
  const meta = stateMetadata[state]
  if (!meta) return null

  const Icon = iconMap[meta.icon] || FileEdit
  const colors = colorMap[meta.color] || colorMap.slate

  return (
    <div
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all cursor-pointer',
        colors.bg,
        colors.border,
        isCurrent && 'ring-2 ring-coral-500 ring-offset-2',
        isCompleted && 'opacity-60',
        !isActive && !isCompleted && !isCurrent && 'opacity-40',
        onClick && 'hover:scale-105'
      )}
      onClick={onClick}
    >
      {isCurrent && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-coral-500 text-white text-xs animate-pulse">
            Current
          </Badge>
        </div>
      )}
      {isCompleted && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle2 className="w-5 h-5 text-sage-500" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('w-5 h-5', colors.text)} />
        </div>
        <div>
          <div className={cn('font-semibold text-sm', colors.text)}>
            {meta.label}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-1">
            {meta.description}
          </div>
        </div>
      </div>
    </div>
  )
}

interface StateMachineVisualizerProps {
  currentState: string
  stateHistory?: Array<{ state: string; timestamp: string }>
  onStateClick?: (state: string) => void
  compact?: boolean
}

export function StateMachineVisualizer({
  currentState,
  stateHistory = [],
  onStateClick,
  compact = false,
}: StateMachineVisualizerProps) {
  const completedStates = useMemo(() => {
    return stateHistory.map(h => h.state)
  }, [stateHistory])

  // Define the main flow with admin review
  const mainFlow: BountyState[] = [
    'drafting',
    'pending_admin_review',
    'ready_for_funding',
    'funding_escrow',
    'bidding',
    'active_research',
    'milestone_review',
    'completed_payout',
    'completed',
  ]

  // Admin review branch
  const adminReviewFlow: BountyState[] = [
    'requires_changes',
    'rejected',
  ]

  // Deadline management branch
  const deadlineFlow: BountyState[] = [
    'extension_review',
    'deadline_breach',
  ]

  // Dispute branch
  const disputeFlow: BountyState[] = [
    'dispute_resolution',
    'external_arbitration',
    'partial_settlement',
  ]

  const cancelFlow: BountyState[] = ['refunding', 'cancelled']

  if (compact) {
    // Compact horizontal view
    return (
      <div className="flex items-center gap-2 overflow-x-auto py-2">
        {mainFlow.map((state, index) => {
          const isCompleted = completedStates.includes(state)
          const isCurrent = currentState === state
          const meta = stateMetadata[state]
          const colors = colorMap[meta?.color || 'slate']
          const Icon = iconMap[meta?.icon || 'FileEdit'] || FileEdit

          return (
            <div key={state} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                  colors.bg,
                  colors.border,
                  isCurrent && 'ring-2 ring-coral-500',
                  isCompleted && 'opacity-60',
                  !isCompleted && !isCurrent && 'opacity-40'
                )}
              >
                <Icon className={cn('w-4 h-4', colors.text)} />
                <span className={cn('text-sm font-medium', colors.text)}>
                  {meta?.label}
                </span>
                {isCompleted && <CheckCircle2 className="w-3 h-3 text-sage-500" />}
              </div>
              {index < mainFlow.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-coral-500" />
          Bounty Lifecycle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Flow */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Main Flow</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {mainFlow.slice(0, 4).map((state) => (
              <StateNode
                key={state}
                state={state}
                isCompleted={completedStates.includes(state)}
                isCurrent={currentState === state}
                isActive={true}
                onClick={() => onStateClick?.(state)}
              />
            ))}
          </div>
          <div className="flex justify-center">
            <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {mainFlow.slice(4).map((state) => (
              <StateNode
                key={state}
                state={state}
                isCompleted={completedStates.includes(state)}
                isCurrent={currentState === state}
                isActive={true}
                onClick={() => onStateClick?.(state)}
              />
            ))}
          </div>
        </div>

        {/* Admin Review Branch */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-coral-500" />
            Admin Moderation Path
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {adminReviewFlow.map((state) => (
              <StateNode
                key={state}
                state={state}
                isCompleted={completedStates.includes(state)}
                isCurrent={currentState === state}
                isActive={adminReviewFlow.some(s => completedStates.includes(s)) || currentState === state}
                onClick={() => onStateClick?.(state)}
              />
            ))}
          </div>
        </div>

        {/* Deadline Management Branch */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Deadline Management Path
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {deadlineFlow.map((state) => (
              <StateNode
                key={state}
                state={state}
                isCompleted={completedStates.includes(state)}
                isCurrent={currentState === state}
                isActive={deadlineFlow.some(s => completedStates.includes(s)) || currentState === state}
                onClick={() => onStateClick?.(state)}
              />
            ))}
          </div>
        </div>

        {/* Dispute Branch */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-alert-500" />
            Dispute Resolution Path
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {disputeFlow.map((state) => (
              <StateNode
                key={state}
                state={state}
                isCompleted={completedStates.includes(state)}
                isCurrent={currentState === state}
                isActive={disputeFlow.some(s => completedStates.includes(s)) || currentState === state}
                onClick={() => onStateClick?.(state)}
              />
            ))}
          </div>
        </div>

        {/* Cancel Branch */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <XCircle className="w-4 h-4 text-charcoal-400" />
            Cancellation Path
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {cancelFlow.map((state) => (
              <StateNode
                key={state}
                state={state}
                isCompleted={completedStates.includes(state)}
                isCurrent={currentState === state}
                isActive={cancelFlow.some(s => completedStates.includes(s)) || currentState === state}
                onClick={() => onStateClick?.(state)}
              />
            ))}
          </div>
        </div>

        {/* State History */}
        {stateHistory.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              State History
            </h4>
            <div className="space-y-2">
              {stateHistory.slice(-5).reverse().map((entry, index) => {
                const meta = stateMetadata[entry.state as BountyState]
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                      <span>{meta?.label || entry.state}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
