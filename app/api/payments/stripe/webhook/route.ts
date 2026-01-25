import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// POST /api/payments/stripe/webhook - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = await createClient()

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bountyId = paymentIntent.metadata.bounty_id
        const userId = paymentIntent.metadata.user_id

        if (!bountyId || !userId) {
          console.error('Missing bounty_id or user_id in payment intent metadata')
          break
        }

        // Update escrow status to locked
        await supabase
          .from('escrows')
          .update({ 
            status: 'locked',
            locked_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        // Get current bounty to update state_history
        const { data: currentBounty } = await supabase
          .from('bounties')
          .select('state_history')
          .eq('id', bountyId)
          .single()

        const newStateHistory = [
          ...(currentBounty?.state_history || []),
          { 
            from_state: 'funding_escrow',
            to_state: 'bidding', 
            timestamp: new Date().toISOString(), 
            changed_by: userId,
          }
        ]

        // Transition bounty to bidding (funds are now locked)
        await supabase
          .from('bounties')
          .update({
            state: 'bidding',
            funded_at: new Date().toISOString(),
            state_history: newStateHistory,
          })
          .eq('id', bountyId)

        // Create notification
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'payment_received',
          title: 'Bounty Funded Successfully',
          message: 'Your bounty is now live and accepting proposals from labs.',
          data: { bounty_id: bountyId },
        })

        // Log activity
        await supabase.from('activity_logs').insert({
          user_id: userId,
          bounty_id: bountyId,
          action: 'payment_completed',
          details: { 
            payment_method: 'stripe',
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
          },
        })

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bountyId = paymentIntent.metadata.bounty_id
        const userId = paymentIntent.metadata.user_id

        // Update escrow status
        await supabase
          .from('escrows')
          .update({ status: 'pending' }) // Reset to pending on failure
          .eq('stripe_payment_intent_id', paymentIntent.id)

        // Create notification if we have user info
        if (userId) {
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'system',
            title: 'Payment Failed',
            message: 'Your payment could not be processed. Please try again.',
            data: { bounty_id: bountyId },
          })
        }

        break
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Update escrow status
        await supabase
          .from('escrows')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error in Stripe webhook:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
