"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  CreditCard,
  Wallet,
  Lock,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Shield,
  ExternalLink,
  Copy,
  AlertCircle
} from "lucide-react"

type PaymentMethod = "stripe" | "solana_usdc" | "base_usdc"
type PaymentStep = "select" | "details" | "processing" | "confirmed" | "error"

interface PaymentModalProps {
  bountyId?: string
  bountyTitle: string
  amount: number
  currency: "USD" | "USDC"
  onComplete?: (result: { method: PaymentMethod; transactionId: string }) => void
  trigger?: React.ReactNode
}

// Wallet connection utilities
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean
      connect: () => Promise<{ publicKey: { toString: () => string } }>
      disconnect: () => Promise<void>
      signTransaction?: (tx: unknown) => Promise<unknown>
    }
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, callback: (args: unknown) => void) => void
      removeListener: (event: string, callback: (args: unknown) => void) => void
    }
  }
}

const paymentMethods = [
  {
    id: "stripe" as const,
    name: "Credit Card",
    description: "Pay with Visa, Mastercard, or Amex",
    icon: CreditCard,
    currencies: ["USD"],
    processingTime: "Instant",
    fees: "2.9% + $0.30",
  },
  {
    id: "solana_usdc" as const,
    name: "Solana USDC",
    description: "Pay with USDC on Solana blockchain",
    icon: Wallet,
    currencies: ["USDC"],
    processingTime: "~1 second",
    fees: "< $0.01",
  },
  {
    id: "base_usdc" as const,
    name: "Base USDC",
    description: "Pay with USDC on Base L2",
    icon: Wallet,
    currencies: ["USDC"],
    processingTime: "~2 seconds",
    fees: "< $0.05",
  },
]

export function PaymentModal({
  bountyId,
  bountyTitle,
  amount,
  currency,
  onComplete,
  trigger
}: PaymentModalProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<PaymentStep>("select")
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  // Card details for Stripe
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")

  // Wallet state
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  // Check for existing wallet connections on mount
  useEffect(() => {
    const checkExistingConnections = async () => {
      // Check Solana (Phantom)
      if (window.solana?.isPhantom) {
        try {
          const resp = await window.solana.connect()
          if (resp.publicKey) {
            setWalletAddress(resp.publicKey.toString())
          }
        } catch {
          // User hasn't connected yet, that's fine
        }
      }
    }
    checkExistingConnections()
  }, [])

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setStep("details")
    setError(null)
    setWalletConnected(false)
    setWalletAddress(null)
  }

  const handleConnectWallet = useCallback(async () => {
    setIsProcessing(true)
    setError(null)

    try {
      if (selectedMethod === "solana_usdc") {
        // Connect to Phantom wallet
        if (!window.solana?.isPhantom) {
          throw new Error("Phantom wallet not found. Please install it from phantom.app")
        }
        const response = await window.solana.connect()
        setWalletAddress(response.publicKey.toString())
        setWalletConnected(true)
      } else if (selectedMethod === "base_usdc") {
        // Connect to MetaMask or Coinbase Wallet
        if (!window.ethereum) {
          throw new Error("No Ethereum wallet found. Please install MetaMask or Coinbase Wallet")
        }
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        }) as string[]
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0])
          setWalletConnected(true)

          // Switch to Base network if needed
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x2105" }], // Base mainnet chain ID
            })
          } catch (switchError: unknown) {
            // Chain not added, try adding it
            if ((switchError as { code?: number })?.code === 4902) {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                  chainId: "0x2105",
                  chainName: "Base",
                  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                  rpcUrls: ["https://mainnet.base.org"],
                  blockExplorerUrls: ["https://basescan.org"],
                }],
              })
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    } finally {
      setIsProcessing(false)
    }
  }, [selectedMethod])

  const handleProcessPayment = async () => {
    if (!selectedMethod) return

    setStep("processing")
    setIsProcessing(true)
    setError(null)

    try {
      // Call the payment API
      const response = await fetch("/api/payments/crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bountyId,
          amount,
          currency,
          paymentMethod: selectedMethod,
          walletAddress,
          // For Stripe, include card token (in production, use Stripe Elements)
          ...(selectedMethod === "stripe" && {
            paymentMethodId: `pm_card_${Date.now()}`, // Would be real Stripe PM ID
          }),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Payment processing failed")
      }

      setTransactionId(result.transactionId || result.escrowDetails?.stripePaymentIntentId)
      setStep("confirmed")

      if (onComplete) {
        onComplete({
          method: selectedMethod,
          transactionId: result.transactionId,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
      setStep("error")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    // Reset state after animation
    setTimeout(() => {
      setStep("select")
      setSelectedMethod(null)
      setIsProcessing(false)
      setError(null)
      setWalletConnected(false)
      setWalletAddress(null)
      setTransactionId(null)
    }, 300)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const filteredMethods = paymentMethods.filter(m => 
    m.currencies.includes(currency)
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="bg-amber-500 hover:bg-amber-400 text-navy-900">
            <Lock className="w-4 h-4 mr-2" />
            Fund Escrow
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">Fund Bounty Escrow</SheetTitle>
          <SheetDescription>
            Secure your funds in escrow for milestone-based release
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Amount Display */}
          <Card className="border-0 bg-navy-800 text-white">
            <CardContent className="p-4">
              <p className="text-navy-200 text-sm">Amount to Escrow</p>
              <p className="text-3xl font-bold font-mono mt-1">
                {currency === "USD" ? "$" : ""}{amount.toLocaleString()}
                <span className="text-lg text-navy-300 ml-2">{currency}</span>
              </p>
              <p className="text-navy-300 text-sm mt-2 truncate">
                {bountyTitle}
              </p>
            </CardContent>
          </Card>

          {/* Step: Select Payment Method */}
          {step === "select" && (
            <div className="space-y-3">
              <p className="font-medium text-navy-800 dark:text-white">Select Payment Method</p>
              {filteredMethods.map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.id}
                    onClick={() => handleSelectMethod(method.id)}
                    className="w-full p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 transition-colors text-left flex items-center gap-4"
                  >
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                      <Icon className="w-6 h-6 text-navy-600 dark:text-navy-300" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-navy-800 dark:text-white">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">{method.processingTime}</p>
                      <p className="text-xs text-muted-foreground">Fee: {method.fees}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step: Payment Details */}
          {step === "details" && selectedMethod && (
            <div className="space-y-4">
              <button 
                onClick={() => setStep("select")}
                className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                ← Back to payment methods
              </button>

              {/* Stripe Form */}
              {selectedMethod === "stripe" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-navy-800 dark:text-white">Card Number</label>
                    <Input 
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="mt-1 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-navy-800 dark:text-white">Expiry</label>
                      <Input 
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-navy-800 dark:text-white">CVC</label>
                      <Input 
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="mt-1 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    Payments secured by Stripe. Card will be authorized, not charged until milestones are approved.
                  </div>
                </div>
              )}

              {/* Solana Wallet */}
              {selectedMethod === "solana_usdc" && (
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  {!walletConnected ? (
                    <Button
                      onClick={handleConnectWallet}
                      className="w-full bg-[#9945FF] hover:bg-[#8839e0]"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wallet className="w-4 h-4 mr-2" />
                      )}
                      Connect Phantom Wallet
                    </Button>
                  ) : (
                    <div className="p-4 bg-sage-50 dark:bg-sage-900/20 rounded-lg border border-sage-200 dark:border-sage-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-sage-600" />
                          <span className="font-medium text-sage-700 dark:text-sage-400">Wallet Connected</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => walletAddress && copyToClipboard(walletAddress)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      {walletAddress && (
                        <p className="font-mono text-sm text-slate-600 dark:text-slate-400 mt-2">
                          {walletAddress.slice(0, 12)}...{walletAddress.slice(-8)}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    USDC will be transferred to escrow. Released to lab upon milestone approval.
                  </div>
                </div>
              )}

              {/* Base Wallet */}
              {selectedMethod === "base_usdc" && (
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  {!walletConnected ? (
                    <Button
                      onClick={handleConnectWallet}
                      className="w-full bg-[#0052FF] hover:bg-[#0047e0]"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wallet className="w-4 h-4 mr-2" />
                      )}
                      Connect MetaMask / Coinbase Wallet
                    </Button>
                  ) : (
                    <div className="p-4 bg-sage-50 dark:bg-sage-900/20 rounded-lg border border-sage-200 dark:border-sage-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-sage-600" />
                          <span className="font-medium text-sage-700 dark:text-sage-400">Wallet Connected</span>
                        </div>
                        <Badge variant="outline">Base Network</Badge>
                      </div>
                      {walletAddress && (
                        <p className="font-mono text-sm text-slate-600 dark:text-slate-400 mt-2">
                          {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    USDC will be deposited to escrow on Base L2.
                  </div>
                </div>
              )}

              {/* Confirm Button */}
              <Button 
                onClick={handleProcessPayment}
                className="w-full bg-amber-500 hover:bg-amber-400 text-navy-900"
                disabled={selectedMethod !== "stripe" && !walletConnected}
              >
                <Lock className="w-4 h-4 mr-2" />
                Lock ${amount.toLocaleString()} in Escrow
              </Button>
            </div>
          )}

          {/* Step: Processing */}
          {step === "processing" && (
            <div className="py-12 text-center">
              <Loader2 className="w-16 h-16 mx-auto text-amber-500 animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-navy-800 dark:text-white mb-2">
                Processing Payment
              </h3>
              <p className="text-muted-foreground">
                {selectedMethod === "stripe" 
                  ? "Authorizing your card..."
                  : "Confirming transaction on-chain..."
                }
              </p>
            </div>
          )}

          {/* Step: Error */}
          {step === "error" && (
            <div className="py-8 text-center">
              <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-navy-800 dark:text-white mb-2">
                Payment Failed
              </h3>
              <p className="text-muted-foreground mb-6">
                {error || "An error occurred during payment processing"}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("details")} className="flex-1">
                  Try Again
                </Button>
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Step: Confirmed */}
          {step === "confirmed" && (
            <div className="py-8 text-center">
              <div className="w-20 h-20 mx-auto bg-sage-100 dark:bg-sage-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-sage-600" />
              </div>
              <h3 className="text-xl font-semibold text-navy-800 dark:text-white mb-2">
                Escrow Funded!
              </h3>
              <p className="text-muted-foreground mb-6">
                ${amount.toLocaleString()} {currency} has been secured in escrow
              </p>

              <Card className="border-0 bg-slate-50 dark:bg-slate-800 text-left mb-6">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-medium capitalize">
                      {selectedMethod?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transaction</span>
                    {transactionId ? (
                      <button
                        onClick={() => copyToClipboard(transactionId)}
                        className="font-mono text-xs flex items-center gap-1 hover:text-primary"
                      >
                        {transactionId.slice(0, 8)}...{transactionId.slice(-6)}
                        <Copy className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="font-mono text-xs">Processing...</span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className="bg-sage-100 text-sage-700 border-0">Locked</Badge>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleClose} className="w-full">
                Continue to Bounty
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Export a simplified version for quick access
export function QuickFundButton({
  bountyId,
  amount,
  currency = "USDC",
  bountyTitle = "Research Bounty"
}: {
  bountyId?: string
  amount: number
  currency?: "USD" | "USDC"
  bountyTitle?: string
}) {
  return (
    <PaymentModal
      bountyId={bountyId}
      amount={amount}
      currency={currency}
      bountyTitle={bountyTitle}
    />
  )
}
