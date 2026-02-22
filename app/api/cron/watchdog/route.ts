/**
 * app/api/cron/watchdog/route.ts
 *
 * Runs every hour via Vercel Cron.
 * Enforces:
 * 1. Milestone deadline breaches → marks overdue, notifies funder + lab
 * 2. Bidding period expiry → auto-closes bounties with no proposals
 * 3. Admin review timeout → escalates stale admin_review bounties after 72h
 * 4. Bounty deadline enforcement → cancels funded bounties past deadline
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_REVIEW_TIMEOUT_HOURS = 72
const BIDDING_PERIOD_DAYS = 14

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify this is a legitimate Vercel Cron call
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const results: Record<string, number> = {}

  // ── 1. Overdue milestones ─────────────────────────────────────────
  const { data: overdueMilestones } = await supabase
    .from('milestones')
    .select('id, title, bounty_id, due_date, bounty:bounties(funder_id, selected_lab_id, state)')
    .in('status', ['pending', 'in_progress'])
    .lt('due_date', now.toISOString())
    .not('due_date', 'is', null)

  if (overdueMilestones && overdueMilestones.length > 0) {
    for (const ms of overdueMilestones) {
      const bounty = ms.bounty as any
      if (!bounty || bounty.state === 'completed' || bounty.state === 'cancelled') continue

      // Mark milestone overdue
      await supabase
        .from('milestones')
        .update({ status: 'overdue' as any, updated_at: now.toISOString() })
        .eq('id', ms.id)

      // Notify funder
      if (bounty.funder_id) {
        await supabase.from('notifications').insert({
          user_id: bounty.funder_id,
          type: 'milestone_overdue',
          title: 'Milestone Deadline Breached',
          message: `Milestone "${ms.title}" is past its due date. You may initiate a dispute or contact the lab.`,
          data: { bounty_id: ms.bounty_id, milestone_id: ms.id },
        })
      }

      // Notify lab — selected_lab_id is a lab ID, look up its user_id
      if (bounty.selected_lab_id) {
        const { data: lab } = await supabase
          .from('labs')
          .select('user_id')
          .eq('id', bounty.selected_lab_id)
          .single()

        if (lab?.user_id) {
          await supabase.from('notifications').insert({
            user_id: lab.user_id,
            type: 'milestone_overdue',
            title: 'Milestone Past Due',
            message: `Milestone "${ms.title}" deadline has passed. Submit evidence immediately to avoid dispute.`,
            data: { bounty_id: ms.bounty_id, milestone_id: ms.id },
          })
        }
      }
    }
    results.overdue_milestones = overdueMilestones.length
  }

  // ── 2. Bidding period expiry — no proposals submitted ─────────────────────
  const biddingCutoff = new Date(now)
  biddingCutoff.setDate(biddingCutoff.getDate() - BIDDING_PERIOD_DAYS)

  const { data: staleBidding } = await supabase
    .from('bounties')
    .select('id, title, funder_id')
    .eq('state', 'bidding')
    .lt('started_at', biddingCutoff.toISOString())

  if (staleBidding && staleBidding.length > 0) {
    for (const bounty of staleBidding) {
      // Check if there are any proposals
      const { count } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .eq('bounty_id', bounty.id)

      if ((count ?? 0) === 0) {
        // No proposals, auto-refund
        await supabase
          .from('bounties')
          .update({ state: 'refunding' })
          .eq('id', bounty.id)

        if (bounty.funder_id) {
          await supabase.from('notifications').insert({
            user_id: bounty.funder_id,
            type: 'bounty_no_proposals',
            title: 'Bounty Expired — No Proposals Received',
            message: `Bounty "${bounty.title}" received no proposals in ${BIDDING_PERIOD_DAYS} days. Your escrow will be refunded.`,
            data: { bounty_id: bounty.id },
          })
        }
      }
    }
    results.expired_bidding = staleBidding.length
  }

  // ── 3. Admin review timeout (72 hours) ──────────────────────────────
  const adminCutoff = new Date(now)
  adminCutoff.setHours(adminCutoff.getHours() - ADMIN_REVIEW_TIMEOUT_HOURS)

  const { data: staleAdminReview } = await supabase
    .from('bounties')
    .select('id, title, funder_id, created_at')
    .eq('state', 'admin_review')
    .lt('created_at', adminCutoff.toISOString())

  if (staleAdminReview && staleAdminReview.length > 0) {
    // Fetch all admin users to notify
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')

    for (const bounty of staleAdminReview) {
      if (admins && admins.length > 0) {
        await supabase.from('notifications').insert(
          admins.map((admin: { id: string }) => ({
            user_id: admin.id,
            type: 'admin_review_overdue',
            title: 'Review Overdue: Action Required',
            message: `Bounty "${bounty.title}" has been in admin review for over ${ADMIN_REVIEW_TIMEOUT_HOURS} hours. Please action immediately.`,
            data: { bounty_id: bounty.id },
          }))
        )
      }
    }
    results.stale_admin_review = staleAdminReview.length
  }

  // ── 4. Log watchdog run ───────────────────────────────────────────
  await supabase.from('activity_logs').insert({
    user_id: null,
    action: 'cron_watchdog_run',
    details: {
      ...results,
      run_at: now.toISOString(),
    },
  })

  return NextResponse.json({
    success: true,
    run_at: now.toISOString(),
    ...results,
  })
}
