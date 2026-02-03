import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null

/**
 * POST /api/payments/stripe/capture
 * Capture (partial) payment for milestone release
 *
 * This endpoint is called when a milestone is approved to release funds to the lab.
 * It captures the appropriate portion of the held payment intent.
 */
export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { escrow_id, milestone_id, amount } = body

    if (!escrow_id || !milestone_id || !amount) {
      return NextResponse.json({
        error: 'Missing required fields: escrow_id, milestone_id, amount'
      }, { status: 400 })
    }

    // Validate amount
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    // Get escrow with bounty info
    const { data: escrow, error: escrowError } = await supabase
      .from('escrows')
      .select(`
        *,
        bounty:bounties!escrows_bounty_id_fkey(
          id, funder_id, selected_lab_id,
          selected_lab:labs!bounties_selected_lab_id_fkey(id, user_id, name)
        )
      `)
      .eq('id', escrow_id)
      .single()

    if (escrowError || !escrow) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    }

    // Verify user is the bounty funder
    if (escrow.bounty.funder_id !== user.id) {
      return NextResponse.json({ error: 'Only the bounty funder can release payments' }, { status: 403 })
    }

    // Verify payment method is Stripe
    if (escrow.payment_method !== 'stripe') {
      return NextResponse.json({ error: 'This escrow does not use Stripe' }, { status: 400 })
    }

    // Get the Stripe payment intent ID
    const paymentIntentId = escrow.stripe_payment_intent_id
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'No Stripe payment intent found' }, { status: 400 })
    }

    // Get milestone to verify it's approved
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', milestone_id)
      .single()

    if (milestoneError || !milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    if (milestone.status !== 'verified') {
      return NextResponse.json({ error: 'Milestone must be verified before payment release' }, { status: 400 })
    }

    // Check if this milestone has already been paid
    const { data: existingRelease } = await supabase
      .from('escrow_releases')
      .select('id')
      .eq('milestone_id', milestone_id)
      .single()

    if (existingRelease) {
      return NextResponse.json({ error: 'Payment already released for this milestone' }, { status: 400 })
    }

    // Get current payment intent status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Calculate amount to capture in cents
    const amountInCents = Math.round(parsedAmount * 100)

    // Platform fee (configurable, default 5%)
    const platformFeePercent = parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '5')
    const platformFee = Math.round(amountInCents * platformFeePercent / 100)
    const labPayout = amountInCents - platformFee

    let captureResult

    if (paymentIntent.status === 'requires_capture') {
      // First capture - capture the amount
      captureResult = await stripe.paymentIntents.capture(paymentIntentId, {
        amount_to_capture: amountInCents,
      })
    } else if (paymentIntent.status === 'succeeded') {
      // Already captured (possibly partial) - just record the release
      // In a real system, you might use Stripe Connect transfers here
      captureResult = paymentIntent
    } else {
      return NextResponse.json({
        error: `Cannot capture payment in status: ${paymentIntent.status}`
      }, { status: 400 })
    }

    // Record the escrow release
    const { error: releaseError } = await supabase
      .from('escrow_releases')
      .insert({
        escrow_id: escrow.id,
        milestone_id: milestone_id,
        amount: parsedAmount,
        transaction_hash: captureResult.id,
        released_at: new Date().toISOString(),
      })

    if (releaseError) {
      console.error('Error recording release:', releaseError)
      return NextResponse.json({ error: 'Failed to record release' }, { status: 500 })
    }

    // Update escrow released amount using RPC
    await supabase.rpc('increment_escrow_released', {
      p_escrow_id: escrow.id,
      p_amount: parsedAmount
    })

    // Notify the lab
    if (escrow.bounty.selected_lab?.user_id) {
      await supabase.from('notifications').insert({
        user_id: escrow.bounty.selected_lab.user_id,
        type: 'payment_received',
        title: 'Payment Released',
        message: `$${parsedAmount.toFixed(2)} has been released for your completed milestone.`,
        data: {
          bounty_id: escrow.bounty_id,
          milestone_id: milestone_id,
          amount: parsedAmount,
        },
      })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      bounty_id: escrow.bounty_id,
      action: 'payment_released',
      details: {
        milestone_id,
        amount: parsedAmount,
        lab_payout: labPayout / 100,
        platform_fee: platformFee / 100,
        stripe_id: captureResult.id,
      },
    })

    return NextResponse.json({
      success: true,
      captured_amount: amountInCents / 100,
      lab_payout: labPayout / 100,
      platform_fee: platformFee / 100,
      stripe_id: captureResult.id,
    })
  } catch (error) {
    console.error('Error in POST /api/payments/stripe/capture:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
