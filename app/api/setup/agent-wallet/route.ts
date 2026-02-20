/**
 * ONE-TIME SETUP: Creates the AgentKit CDP wallet and returns wallet data.
 * 
 * Protected by SETUP_SECRET env var.
 * Call once: curl https://sciflowlabs.com/api/setup/agent-wallet?secret=YOUR_SECRET
 * Then save the returned AGENT_WALLET_DATA to Vercel env vars.
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  // Protect with a secret so only you can call this
  const secret = req.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.SETUP_SECRET

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKeyName = process.env.CDP_API_KEY_NAME
  const apiKeyPrivateKey = process.env.CDP_API_KEY_PRIVATE_KEY

  if (!apiKeyName || !apiKeyPrivateKey) {
    return NextResponse.json({ error: 'CDP keys not configured' }, { status: 500 })
  }

  // Check if wallet already exists
  if (process.env.AGENT_WALLET_DATA) {
    try {
      const existing = JSON.parse(process.env.AGENT_WALLET_DATA)
      return NextResponse.json({
        status: 'already_exists',
        message: 'Agent wallet already configured. Delete AGENT_WALLET_DATA to recreate.',
        walletId: existing.wallet_id || existing.walletId,
      })
    } catch {
      // Invalid JSON, recreate
    }
  }

  try {
    const { Coinbase, Wallet } = await import('@coinbase/coinbase-sdk')

    Coinbase.configure({
      apiKeyName,
      privateKey: apiKeyPrivateKey.replace(/\\n/g, '\n'),
    })

    // Create a new wallet on Base mainnet
    const wallet = await Wallet.create({ networkId: 'base-mainnet' })
    const defaultAddress = await wallet.getDefaultAddress()
    const address = defaultAddress.getId()

    // Export wallet data (contains seed for restoration)
    const walletData = wallet.export()
    const walletDataStr = JSON.stringify(walletData)

    return NextResponse.json({
      status: 'created',
      address,
      basescan: `https://basescan.org/address/${address}`,
      AGENT_WALLET_DATA: walletDataStr,
      instruction: 'Copy AGENT_WALLET_DATA value, run the command below, then redeploy.',
      vercel_command: `printf '${walletDataStr.replace(/\\/g, '\\\\').replace(/'/g, "'\\''")}' | vercel env add AGENT_WALLET_DATA production --force`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
