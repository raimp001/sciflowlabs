import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null

// POST /api/payments/stripe - Create payment intent for bounty funding
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
    const { bounty_id, amount, currency } = body

    if (!bounty_id || amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Missing bounty_id or amount' }, { status: 400 })
    }

    // Validate amount is a positive finite number
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    // Validate reasonable bounds (min $1, max $10M)
    if (parsedAmount < 1 || parsedAmount > 10000000) {
      return NextResponse.json({
        error: 'Amount must be between $1 and $10,000,000'
      }, { status: 400 })
    }

    // Verify bounty exists and belongs to user
    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .select('id, title, funder_id, state, total_budget')
      .eq('id', bounty_id)
      .single()

    if (bountyError || !bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    if (bounty.funder_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to fund this bounty' }, { status: 403 })
    }

    if (bounty.state !== 'drafting' && bounty.state !== 'ready_for_funding') {
      return NextResponse.json({ error: 'Bounty is not in a fundable state' }, { status: 400 })
    }

    // Calculate platform fee
    const platformFeePercent = parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '5')
    const platformFee = Math.round(parsedAmount * platformFeePercent / 100)
    const totalAmount = parsedAmount + platformFee

    // Create Stripe payment intent with manual capture
    // This allows us to hold funds in escrow until milestones are completed
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe uses cents
      currency: (currency || 'usd').toLowerCase(),
      capture_method: 'manual', // Don't capture immediately - escrow style
      metadata: {
        bounty_id,
        user_id: user.id,
        platform_fee: platformFee.toString(),
        original_amount: amount.toString(),
      },
      description: `SciFlow Bounty: ${bounty.title}`,
    })

    // Create escrow record
    const { error: escrowError } = await supabase
      .from('escrows')
      .upsert({
        bounty_id,
        payment_method: 'stripe',
        payment_intent_id: paymentIntent.id,
        total_amount: totalAmount,
        platform_fee: platformFee,
        currency: currency || 'USD',
        status: 'pending',
      })

    if (escrowError) {
      console.error('Error creating escrow:', escrowError)
      // Cancel the payment intent if escrow creation fails
      await stripe.paymentIntents.cancel(paymentIntent.id)
      return NextResponse.json({ error: 'Failed to create escrow record' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      bounty_id,
      action: 'payment_initiated',
      details: { 
        payment_method: 'stripe',
        amount: totalAmount,
        payment_intent_id: paymentIntent.id,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      platformFee,
    })
  } catch (error) {
    console.error('Error in POST /api/payments/stripe:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/payments/stripe - Get payment status
export async function GET(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('payment_intent_id')

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Missing payment_intent_id' }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    return NextResponse.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    })
  } catch (error) {
    console.error('Error in GET /api/payments/stripe:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
