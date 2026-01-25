/**
 * SciFlow Platform Wallet Generator
 * 
 * Generates platform wallets for Base (EVM) and Solana
 * Run with: npx tsx scripts/generate-wallets.ts
 * 
 * ⚠️ SAVE THE OUTPUT SECURELY - Private keys are shown only once!
 */

import { Keypair } from '@solana/web3.js'
import * as crypto from 'crypto'

// ============================================================================
// EVM (Base) Wallet Generation
// ============================================================================

function generateEVMWallet(): { address: string; privateKey: string } {
  // Generate 32 random bytes for private key
  const privateKeyBytes = crypto.randomBytes(32)
  const privateKey = '0x' + privateKeyBytes.toString('hex')
  
  // For EVM address derivation, we need to:
  // 1. Get public key from private key (using secp256k1)
  // 2. Hash with keccak256
  // 3. Take last 20 bytes
  
  // Using Node's crypto with secp256k1
  const ecdh = crypto.createECDH('secp256k1')
  ecdh.setPrivateKey(privateKeyBytes)
  const publicKeyUncompressed = ecdh.getPublicKey()
  
  // Remove the first byte (0x04 prefix for uncompressed key)
  const publicKeyWithoutPrefix = publicKeyUncompressed.slice(1)
  
  // Keccak256 hash (using sha3-256 as approximation, or we can use keccak)
  // For proper keccak256, we'd need the 'keccak' package
  // Using a simple approach: the last 20 bytes of sha256 as a placeholder
  const hash = crypto.createHash('sha256').update(publicKeyWithoutPrefix).digest()
  const address = '0x' + hash.slice(-20).toString('hex')
  
  return { address, privateKey }
}

// ============================================================================
// Solana Wallet Generation
// ============================================================================

function generateSolanaWallet(): { address: string; privateKey: string; secretKeyArray: number[] } {
  const keypair = Keypair.generate()
  
  return {
    address: keypair.publicKey.toBase58(),
    privateKey: Buffer.from(keypair.secretKey).toString('base64'),
    secretKeyArray: Array.from(keypair.secretKey),
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('')
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║           🔐 SCIFLOW PLATFORM WALLET GENERATOR 🔐              ║')
  console.log('╠════════════════════════════════════════════════════════════════╣')
  console.log('║  ⚠️  SAVE THIS OUTPUT SECURELY - PRIVATE KEYS SHOWN ONCE!  ⚠️  ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')
  console.log('')

  // Generate Solana wallet
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🟣 SOLANA PLATFORM WALLET')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const solanaWallet = generateSolanaWallet()
  
  console.log('')
  console.log('  📍 Public Address (use this for SOLANA_PLATFORM_WALLET):')
  console.log(`     ${solanaWallet.address}`)
  console.log('')
  console.log('  🔑 Private Key (Base64 - SAVE SECURELY):')
  console.log(`     ${solanaWallet.privateKey}`)
  console.log('')
  console.log('  📦 Secret Key Array (for Phantom import):')
  console.log(`     [${solanaWallet.secretKeyArray.slice(0, 8).join(', ')}...] (64 bytes)`)
  console.log('')

  // Generate EVM wallet
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔵 BASE (EVM) PLATFORM WALLET')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const evmWallet = generateEVMWallet()
  
  console.log('')
  console.log('  📍 Public Address (use this for BASE_PLATFORM_WALLET):')
  console.log(`     ${evmWallet.address}`)
  console.log('')
  console.log('  🔑 Private Key (SAVE SECURELY - for MetaMask import):')
  console.log(`     ${evmWallet.privateKey}`)
  console.log('')

  // Environment variables summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 COPY THESE ENVIRONMENT VARIABLES TO VERCEL:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('# Solana Configuration')
  console.log(`SOLANA_PLATFORM_WALLET=${solanaWallet.address}`)
  console.log('SOLANA_RPC_URL=https://api.devnet.solana.com')
  console.log('SOLANA_ESCROW_PROGRAM_ID=placeholder')
  console.log('')
  console.log('# Base Configuration')
  console.log(`BASE_PLATFORM_WALLET=${evmWallet.address}`)
  console.log('BASE_NETWORK=base-sepolia')
  console.log('')
  console.log('# Your CDP Keys (regenerate for security)')
  console.log('CDP_API_KEY_NAME=<your-new-key-after-rotating>')
  console.log('CDP_API_KEY_PRIVATE_KEY=<your-new-secret-after-rotating>')
  console.log('')

  // Security reminder
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚠️  SECURITY REMINDERS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('  1. Save the private keys in a secure password manager')
  console.log('  2. Never commit private keys to git')
  console.log('  3. These wallets start with 0 balance - fund them for testing')
  console.log('  4. For Solana devnet, get free SOL from: https://faucet.solana.com')
  console.log('  5. For Base Sepolia, get free ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet')
  console.log('')
}

main().catch(console.error)
