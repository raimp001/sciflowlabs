import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * GET /api/staking - Get lab's staking balance and transactions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's lab profile
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('id, staking_balance, locked_stake')
      .eq('user_id', user.id)
      .single()

    if (labError || !lab) {
      return NextResponse.json({ error: 'Lab profile not found' }, { status: 404 })
    }

    // Get recent staking transactions
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    const { data: transactions, error: txError, count } = await supabase
      .from('staking_transactions')
      .select('*', { count: 'exact' })
      .eq('lab_id', lab.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    return NextResponse.json({
      balance: {
        available: parseFloat(lab.staking_balance) - parseFloat(lab.locked_stake),
        locked: parseFloat(lab.locked_stake),
        total: parseFloat(lab.staking_balance),
      },
      transactions: transactions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/staking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const depositSchema = z.object({
  amount: z.number().positive().max(1000000),
  transaction_hash: z.string().optional(),
})

/**
 * POST /api/staking - Deposit stake
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate body
    const body = await request.json()
    const validationResult = depositSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { amount, transaction_hash } = validationResult.data

    // Get user's lab profile
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('id, staking_balance')
      .eq('user_id', user.id)
      .single()

    if (labError || !lab) {
      return NextResponse.json({ error: 'Lab profile not found. Register as a lab first.' }, { status: 404 })
    }

    const currentBalance = parseFloat(lab.staking_balance) || 0
    const newBalance = currentBalance + amount

    // Update lab staking balance
    const { error: updateError } = await supabase
      .from('labs')
      .update({ staking_balance: newBalance })
      .eq('id', lab.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Record transaction
    const { data: transaction, error: txError } = await supabase
      .from('staking_transactions')
      .insert({
        lab_id: lab.id,
        type: 'deposit',
        amount: amount,
        balance_after: newBalance,
        transaction_hash: transaction_hash,
        notes: 'Stake deposit',
      })
      .select()
      .single()

    if (txError) {
      console.error('Error recording staking transaction:', txError)
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'stake_deposited',
      details: { amount, new_balance: newBalance },
    })

    return NextResponse.json({
      success: true,
      balance: {
        previous: currentBalance,
        deposited: amount,
        new: newBalance,
      },
      transaction_id: transaction?.id,
    })
  } catch (error) {
    console.error('Error in POST /api/staking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
