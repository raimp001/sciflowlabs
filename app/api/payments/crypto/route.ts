import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { solanaPayment } from '@/lib/payments/solana'
import { baseCDPPayment, getExplorerTxUrl } from '@/lib/payments/base-cdp'

// Crypto payment endpoints for Solana and Base USDC
// Supports: Solana (SPL USDC) and Base (Coinbase CDP SDK)

// GET /api/payments/crypto/status - Check payment service status
export async function GET() {
  return NextResponse.json({
    solana: {
      configured: solanaPayment.isConfigured(),
      status: solanaPayment.getConfigStatus(),
    },
    base: {
      configured: baseCDPPayment.isConfigured(),
      status: baseCDPPayment.getConfigStatus(),
    },
    supported_chains: ['solana', 'base'],
    token: 'USDC',
  })
}

// POST /api/payments/crypto - Initialize crypto escrow
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bounty_id, chain, amount, wallet_address } = body

    if (!bounty_id || !chain || amount === undefined || amount === null || !wallet_address) {
      return NextResponse.json({
        error: 'Missing required fields: bounty_id, chain, amount, wallet_address'
      }, { status: 400 })
    }

    // Validate amount is a positive finite number
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    // Validate reasonable bounds (min $1, max $10M in USDC)
    if (parsedAmount < 1 || parsedAmount > 10000000) {
      return NextResponse.json({
        error: 'Amount must be between 1 and 10,000,000 USDC'
      }, { status: 400 })
    }

    if (!['solana', 'base'].includes(chain)) {
      return NextResponse.json({ error: 'Invalid chain. Use "solana" or "base"' }, { status: 400 })
    }

    // Verify bounty exists and belongs to user
    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .select('id, title, funder_id, state')
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
    const platformFee = parsedAmount * platformFeePercent / 100
    const totalAmount = parsedAmount + platformFee

    // Generate escrow details based on chain using the appropriate service
    let escrowDetails: {
      escrow_address: string
      deposit_address: string
      expected_amount: number
      chain: string
      token: string
      instructions?: Record<string, unknown>
      chain_id?: number
    }

    if (chain === 'solana') {
      // Use Solana payment service
      const result = await solanaPayment.initializeDeposit({
        bountyId: bounty_id,
        funderWallet: wallet_address,
        amount: totalAmount,
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 503 })
      }

      escrowDetails = {
        escrow_address: result.escrowPDA!,
        deposit_address: result.depositAddress!,
        expected_amount: totalAmount,
        chain: 'solana',
        token: 'USDC',
        instructions: solanaPayment.getDepositInstructions(result.depositAddress!, result.expectedAmount!),
      }
    } else {
      // Use Base CDP payment service
      const result = await baseCDPPayment.initializeDeposit({
        bountyId: bounty_id,
        funderWallet: wallet_address,
        amount: totalAmount,
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 503 })
      }

      escrowDetails = {
        escrow_address: result.escrowAddress!,
        deposit_address: result.depositAddress!,
        expected_amount: totalAmount,
        chain: 'base',
        token: 'USDC',
        chain_id: result.chainId,
        instructions: baseCDPPayment.getDepositInstructions(result.depositAddress!, totalAmount),
      }
    }

    // Create escrow record
    const { data: escrow, error: escrowError } = await supabase
      .from('escrows')
      .upsert({
        bounty_id,
        payment_method: chain,
        escrow_address: escrowDetails.escrow_address,
        deposit_address: escrowDetails.deposit_address,
        total_amount: totalAmount,
        platform_fee: platformFee,
        currency: 'USDC',
        status: 'awaiting_deposit',
        chain_data: {
          chain,
          token: 'USDC',
          funder_wallet: wallet_address,
        },
      })
      .select()
      .single()

    if (escrowError) {
      console.error('Error creating escrow:', escrowError)
      return NextResponse.json({ error: 'Failed to create escrow record' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      bounty_id,
      action: 'crypto_escrow_created',
      details: { 
        chain,
        escrow_address: escrowDetails.escrow_address,
        amount: totalAmount,
      },
    })

    return NextResponse.json({
      escrow_id: escrow.id,
      deposit_address: escrowDetails.deposit_address,
      expected_amount: totalAmount,
      platform_fee: platformFee,
      chain,
      token: 'USDC',
      instructions: chain === 'solana' 
        ? `Send ${totalAmount} USDC to ${escrowDetails.deposit_address} on Solana`
        : `Send ${totalAmount} USDC to ${escrowDetails.deposit_address} on Base`,
    })
  } catch (error) {
    console.error('Error in POST /api/payments/crypto:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/payments/crypto - Verify deposit and confirm escrow
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { escrow_id, tx_hash } = body

    if (!escrow_id || !tx_hash) {
      return NextResponse.json({ error: 'Missing escrow_id or tx_hash' }, { status: 400 })
    }

    // Get escrow record
    const { data: escrow, error: escrowError } = await supabase
      .from('escrows')
      .select(`
        *,
        bounty:bounties!escrows_bounty_id_fkey(id, funder_id)
      `)
      .eq('id', escrow_id)
      .single()

    if (escrowError || !escrow) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    }

    if (escrow.bounty.funder_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Verify the transaction on-chain using the appropriate service
    const chain = escrow.payment_method
    let verificationResult: { success: boolean; txHash?: string; error?: string }

    if (chain === 'solana') {
      verificationResult = await solanaPayment.verifyDeposit(tx_hash, escrow.total_amount)
    } else if (chain === 'base') {
      verificationResult = await baseCDPPayment.verifyDeposit(tx_hash, escrow.total_amount)
    } else {
      return NextResponse.json({ error: 'Unknown chain' }, { status: 400 })
    }

    if (!verificationResult.success) {
      return NextResponse.json({ 
        error: verificationResult.error || 'Transaction verification failed' 
      }, { status: 400 })
    }

    // Build explorer URL for the transaction
    const explorerUrl = chain === 'base' 
      ? getExplorerTxUrl(tx_hash, 'mainnet')
      : `https://solscan.io/tx/${tx_hash}`

    // Update escrow status
    const { error: updateError } = await supabase
      .from('escrows')
      .update({ 
        status: 'funded',
        funded_at: new Date().toISOString(),
        chain_data: {
          ...escrow.chain_data,
          deposit_tx_hash: tx_hash,
          explorer_url: explorerUrl,
          verified_at: new Date().toISOString(),
        },
      })
      .eq('id', escrow_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Transition bounty to bidding
    await supabase
      .from('bounties')
      .update({
        state: 'bidding',
        funded_at: new Date().toISOString(),
      })
      .eq('id', escrow.bounty_id)

    // Update state history using RPC function
    await supabase.rpc('append_state_history', {
      p_bounty_id: escrow.bounty_id,
      p_from_state: 'funding_escrow',
      p_to_state: 'bidding',
      p_changed_by: user.id
    })

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'crypto_deposit_confirmed',
      title: 'Crypto Deposit Confirmed',
      message: 'Your bounty is now live and accepting proposals',
      data: { 
        bounty_id: escrow.bounty_id, 
        tx_hash,
        chain,
        explorer_url: explorerUrl,
      },
    })

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      bounty_id: escrow.bounty_id,
      action: 'crypto_deposit_confirmed',
      details: { 
        escrow_id,
        tx_hash,
        chain,
        explorer_url: explorerUrl,
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Deposit confirmed, bounty is now live',
      tx_hash,
      explorer_url: explorerUrl,
    })
  } catch (error) {
    console.error('Error in PATCH /api/payments/crypto:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
