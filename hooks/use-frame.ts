"use client"

import { useState, useEffect, useCallback } from 'react'
import sdk, { type FrameContext } from '@farcaster/frame-sdk'

interface UseFrameResult {
  isInFrame: boolean
  isSDKLoaded: boolean
  context: FrameContext | null
  error: string | null
  // Actions
  openUrl: (url: string) => Promise<void>
  close: () => Promise<void>
  ready: () => Promise<void>
}

/**
 * Hook for Farcaster Frame / Base Mini App SDK integration.
 *
 * Detects if running inside a frame context (Base app, Warpcast, etc.)
 * and provides access to frame actions.
 *
 * Usage:
 *   const { isInFrame, context, ready } = useFrame()
 *   useEffect(() => { if (isInFrame) ready() }, [isInFrame])
 */
export function useFrame(): UseFrameResult {
  const [isInFrame, setIsInFrame] = useState(false)
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [context, setContext] = useState<FrameContext | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initFrame = async () => {
      try {
        // Check if we're in a frame context
        // The SDK will throw or return null if not in a frame
        const frameContext = await sdk.context

        if (frameContext) {
          setIsInFrame(true)
          setContext(frameContext)
        }
        setIsSDKLoaded(true)
      } catch (err) {
        // Not in a frame context - this is fine for web usage
        setIsInFrame(false)
        setIsSDKLoaded(true)
        console.log('Not running in frame context')
      }
    }

    initFrame()
  }, [])

  const ready = useCallback(async () => {
    if (!isInFrame) return
    try {
      await sdk.actions.ready()
    } catch (err) {
      setError('Failed to signal ready state')
    }
  }, [isInFrame])

  const openUrl = useCallback(async (url: string) => {
    if (!isInFrame) {
      // Fallback for non-frame context
      window.open(url, '_blank')
      return
    }
    try {
      await sdk.actions.openUrl(url)
    } catch (err) {
      // Fallback
      window.open(url, '_blank')
    }
  }, [isInFrame])

  const close = useCallback(async () => {
    if (!isInFrame) return
    try {
      await sdk.actions.close()
    } catch (err) {
      setError('Failed to close frame')
    }
  }, [isInFrame])

  return {
    isInFrame,
    isSDKLoaded,
    context,
    error,
    openUrl,
    close,
    ready,
  }
}

/**
 * Get the current network based on environment and frame context
 */
export function useFrameNetwork() {
  const { context } = useFrame()

  // Default to environment variable, fallback to sepolia for testing
  const envNetwork = process.env.NEXT_PUBLIC_BASE_NETWORK || 'base-sepolia'
  const isTestnet = envNetwork === 'base-sepolia' || envNetwork === 'sepolia'

  return {
    network: isTestnet ? 'baseSepolia' : 'base',
    chainId: isTestnet ? 84532 : 8453,
    isTestnet,
  }
}
