'use client'

/**
 * app/dashboard/proposals/[id]/review/page.tsx  (PR#3)
 *
 * Scientific peer review scorecard for assigned reviewers.
 * Route:  /dashboard/proposals/:id/review
 * Access: role='reviewer' only (enforced client + server)
 *
 * Features:
 *  – 5-dimension scoring sliders (1–5)
 *  – Strengths / Weaknesses / Requested revisions text fields
 *  – Decision: approve | revise | reject
 *  – Conflict of interest declaration
 *  – Weighted overall score preview (30/20/20/15/15%)
 */

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'

const SCORE_FIELDS = [
  { key: 'score_scientific_merit',    label: 'Scientific Merit',       weight: '30%' },
  { key: 'score_feasibility',         label: 'Feasibility',            weight: '20%' },
  { key: 'score_innovation',          label: 'Innovation',             weight: '20%' },
  { key: 'score_team_qualifications', label: 'Team Qualifications',    weight: '15%' },
  { key: 'score_ethics_compliance',   label: 'Ethics Compliance',      weight: '15%' },
] as const

const WEIGHTS: Record<string, number> = {
  score_scientific_merit:    0.30,
  score_feasibility:         0.20,
  score_innovation:          0.20,
  score_team_qualifications: 0.15,
  score_ethics_compliance:   0.15,
}

type ScoreKey = typeof SCORE_FIELDS[number]['key']
type Scores   = Record<ScoreKey, number>
type Decision = 'approve' | 'revise' | 'reject'

function computeOverall(scores: Scores): number {
  return Math.round(
    Object.entries(WEIGHTS).reduce((t, [k, w]) => t + (scores[k as ScoreKey] ?? 3) * w, 0) * 100
  ) / 100
}

export default function ProposalReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const proposalId = params.id

  const initial = Object.fromEntries(
    SCORE_FIELDS.map(f => [f.key, 3])
  ) as Scores

  const [scores,    setScores]   = useState<Scores>(initial)
  const [strengths, setStrengths] = useState('')
  const [weaknesses, setWeaknesses] = useState('')
  const [revisions,  setRevisions]  = useState('')
  const [decision,   setDecision]   = useState<Decision>('approve')
  const [conflict,   setConflict]   = useState(false)
  const [conflictDetails, setConflictDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]     = useState<string | null>(null)
  const [success,    setSuccess]   = useState(false)

  const overallScore = computeOverall(scores)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/proposals/${proposalId}/review`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scores,
          strengths,
          weaknesses,
          requested_revisions:  revisions || null,
          decision,
          conflict_of_interest: conflict,
          conflict_details:     conflictDetails || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')

      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  const scoreColor = (v: number) =>
    v >= 4 ? 'text-green-400' : v <= 2 ? 'text-red-400' : 'text-yellow-400'

  const decisionStyle: Record<Decision, string> = {
    approve: 'bg-green-600 hover:bg-green-700',
    revise:  'bg-yellow-600 hover:bg-yellow-700',
    reject:  'bg-red-600   hover:bg-red-700',
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-white mb-2">Review Submitted</h2>
          <p className="text-gray-400">Redirecting to dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Peer Review</p>
          <h1 className="text-3xl font-serif font-bold">Scientific Scorecard</h1>
          <p className="text-gray-400 mt-2 text-sm">
            This review is double-blind. Do not reference specific lab names or
            identifying information in your comments.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Scores */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
            <h2 className="font-semibold text-white mb-4">
              Scoring Dimensions
              <span className="ml-2 text-xs text-gray-500 font-normal">(1 = poor → 5 = excellent)</span>
            </h2>

            {SCORE_FIELDS.map(({ key, label, weight }) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-gray-300">
                    {label}
                    <span className="ml-1 text-gray-600 text-xs">({weight})</span>
                  </label>
                  <span className={`text-lg font-bold tabular-nums ${scoreColor(scores[key])}`}>
                    {scores[key]}
                  </span>
                </div>
                <input
                  type="range" min={1} max={5} step={1}
                  value={scores[key]}
                  onChange={(e) => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
              </div>
            ))}

            {/* Overall score */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm text-gray-400">Weighted Overall Score</span>
              <span
                className={`text-2xl font-bold tabular-nums ${
                  overallScore >= 4 ? 'text-green-400'
                  : overallScore >= 3 ? 'text-yellow-400'
                  : 'text-red-400'
                }`}
              >
                {overallScore.toFixed(2)} / 5
              </span>
            </div>
          </div>

          {/* Written comments */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-white">Written Assessment</h2>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Strengths <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                rows={3}
                placeholder="What does this proposal do well?"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5
                           text-sm text-white placeholder-gray-600
                           focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Weaknesses <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                rows={3}
                placeholder="What are the key concerns or gaps?"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5
                           text-sm text-white placeholder-gray-600
                           focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Requested Revisions
                <span className="ml-1 text-gray-600 text-xs">(optional)</span>
              </label>
              <textarea
                value={revisions}
                onChange={(e) => setRevisions(e.target.value)}
                rows={2}
                placeholder="Specific changes the lab must make before approval…"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5
                           text-sm text-white placeholder-gray-600
                           focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Conflict of interest */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-3">Conflict of Interest</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={conflict}
                onChange={(e) => setConflict(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm text-gray-300">
                I have a conflict of interest with this proposal
              </span>
            </label>
            {conflict && (
              <textarea
                value={conflictDetails}
                onChange={(e) => setConflictDetails(e.target.value)}
                rows={2}
                placeholder="Describe the conflict…"
                className="mt-3 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5
                           text-sm text-white placeholder-gray-600
                           focus:outline-none focus:border-blue-500"
              />
            )}
          </div>

          {/* Decision */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Decision</h2>
            <div className="flex gap-3">
              {(['approve', 'revise', 'reject'] as Decision[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDecision(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors
                    border-2 ${
                      decision === d
                        ? `${decisionStyle[d]} border-transparent text-white`
                        : 'border-white/20 text-gray-400 hover:border-white/40'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40
                          rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-semibold text-white
                       bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                       transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  )
}
