import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const withdrawSchema = z.object({
  amount: z.number().positive(),
  wallet_address: z.string().min(10),
})

/**
 * POST /api/staking/withdraw - Withdraw available stake
 * Only unlocked stake can be withdrawn
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
    const validationResult = withdrawSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { amount, wallet_address } = validationResult.data

    // Get user's lab profile
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('id, staking_balance, locked_stake')
      .eq('user_id', user.id)
      .single()

    if (labError || !lab) {
      return NextResponse.json({ error: 'Lab profile not found' }, { status: 404 })
    }

    const currentBalance = parseFloat(lab.staking_balance) || 0
    const lockedStake = parseFloat(lab.locked_stake) || 0
    const availableBalance = currentBalance - lockedStake

    // Check if enough available balance
    if (amount > availableBalance) {
      return NextResponse.json({
        error: `Insufficient available balance. Available: ${availableBalance}, Requested: ${amount}`,
        available: availableBalance,
        locked: lockedStake,
      }, { status: 400 })
    }

    const newBalance = currentBalance - amount

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
        type: 'withdrawal',
        amount: amount,
        balance_after: newBalance,
        notes: `Withdrawal to ${wallet_address.slice(0, 10)}...`,
      })
      .select()
      .single()

    if (txError) {
      console.error('Error recording staking transaction:', txError)
    }

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: 'Stake Withdrawal Initiated',
      message: `Your withdrawal of ${amount} has been initiated.`,
      data: { amount, wallet_address },
    })

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'stake_withdrawn',
      details: { amount, new_balance: newBalance, wallet_address },
    })

    return NextResponse.json({
      success: true,
      balance: {
        previous: currentBalance,
        withdrawn: amount,
        new: newBalance,
        available: newBalance - lockedStake,
        locked: lockedStake,
      },
      transaction_id: transaction?.id,
    })
  } catch (error) {
    console.error('Error in POST /api/staking/withdraw:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
