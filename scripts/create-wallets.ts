/**
 * SciFlow Wallet Creation Script
 * 
 * Creates platform wallets for Base (via CDP SDK) and Solana
 * Run with: npx tsx scripts/create-wallets.ts
 */

import { Coinbase, Wallet } from '@coinbase/coinbase-sdk'

async function main() {
  console.log('🚀 SciFlow Wallet Creation Script\n')

  // =========================================================================
  // BASE WALLET (Coinbase CDP SDK)
  // =========================================================================
  
  console.log('='.repeat(60))
  console.log('📦 COINBASE CDP (BASE) WALLET')
  console.log('='.repeat(60))

  const cdpKeyName = process.env.CDP_API_KEY_NAME
  const cdpPrivateKey = process.env.CDP_API_KEY_PRIVATE_KEY
  
  if (!cdpKeyName || !cdpPrivateKey) {
    console.log('❌ CDP credentials not found in environment.')
    console.log('   Set CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY')
    console.log('')
    console.log('   Example:')
    console.log('   export CDP_API_KEY_NAME=your-key-name')
    console.log('   export CDP_API_KEY_PRIVATE_KEY=your-private-key')
  } else {
    try {
      // Configure CDP SDK
      Coinbase.configure({
        apiKeyName: cdpKeyName,
        privateKey: cdpPrivateKey,
      })

      const networkId = (process.env.BASE_NETWORK || 'base-sepolia') as 'base-mainnet' | 'base-sepolia'
      console.log(`\n📡 Network: ${networkId}`)
      
      // Create a new wallet
      console.log('🔐 Creating Base wallet...')
      const wallet = await Wallet.create({ networkId })
      
      const walletId = wallet.getId()
      const address = await wallet.getDefaultAddress()
      const addressId = address?.getId()

      console.log('\n✅ Base Wallet Created!')
      console.log(`   Wallet ID: ${walletId}`)
      console.log(`   Address: ${addressId}`)
      
      console.log('\n📋 Add this to your environment:')
      console.log(`   BASE_PLATFORM_WALLET=${addressId}`)
      console.log(`   CDP_WALLET_ID=${walletId}`)
      
      // Export wallet data for backup
      const walletData = wallet.export()
      console.log('\n⚠️  SAVE THIS WALLET DATA (for recovery):')
      console.log(JSON.stringify(walletData, null, 2))
      
    } catch (error) {
      console.log('❌ Error creating Base wallet:', error)
    }
  }

  // =========================================================================
  // SOLANA WALLET (Manual instructions)
  // =========================================================================
  
  console.log('\n')
  console.log('='.repeat(60))
  console.log('🟣 SOLANA WALLET')
  console.log('='.repeat(60))
  console.log('')
  console.log('To create a Solana wallet, you have two options:')
  console.log('')
  console.log('Option 1: Using Phantom (recommended for beginners)')
  console.log('  1. Install Phantom browser extension: https://phantom.app')
  console.log('  2. Create a new wallet')
  console.log('  3. Copy your public address (starts with a letter)')
  console.log('  4. Set SOLANA_PLATFORM_WALLET=YourAddress')
  console.log('')
  console.log('Option 2: Using Solana CLI')
  console.log('  solana-keygen new --outfile ~/.config/solana/sciflow.json')
  console.log('  solana-keygen pubkey ~/.config/solana/sciflow.json')
  console.log('')
  
  // =========================================================================
  // SUMMARY
  // =========================================================================
  
  console.log('\n')
  console.log('='.repeat(60))
  console.log('📋 ENVIRONMENT VARIABLES NEEDED')
  console.log('='.repeat(60))
  console.log('')
  console.log('# Coinbase CDP (Base)')
  console.log('CDP_API_KEY_NAME=6ece5e61-c775-45a2-b177-f271f67c88fe')
  console.log('CDP_API_KEY_PRIVATE_KEY=Nsv/UonfrGMsLgRq08UM523RPkYtNKX98CGObHr9WiumdOBvGoJE8A0QnSDAa6hr+k6rYWNVpxuJoxh7dkCkmQ==')
  console.log('BASE_NETWORK=base-sepolia')
  console.log('BASE_PLATFORM_WALLET=<address from above>')
  console.log('')
  console.log('# Solana')
  console.log('SOLANA_RPC_URL=https://api.devnet.solana.com')
  console.log('SOLANA_PLATFORM_WALLET=<your phantom/cli wallet address>')
  console.log('SOLANA_ESCROW_PROGRAM_ID=placeholder')
  console.log('')
}

main().catch(console.error)
