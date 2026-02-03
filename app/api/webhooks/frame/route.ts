import { NextRequest, NextResponse } from 'next/server'

/**
 * Frame Webhook Handler
 *
 * Receives webhook notifications from Farcaster/Base when users
 * interact with the mini app frame.
 *
 * Events include:
 * - frame_added: User added the frame to their client
 * - frame_removed: User removed the frame
 * - notifications_enabled: User enabled notifications
 * - notifications_disabled: User disabled notifications
 */

interface FrameWebhookEvent {
  event: 'frame_added' | 'frame_removed' | 'notifications_enabled' | 'notifications_disabled'
  notificationDetails?: {
    url: string
    token: string
  }
  fid: number
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as FrameWebhookEvent

    console.log('Frame webhook received:', {
      event: body.event,
      fid: body.fid,
      timestamp: new Date(body.timestamp * 1000).toISOString(),
    })

    switch (body.event) {
      case 'frame_added':
        // User added the mini app
        // Could store FID for future notifications
        console.log(`User ${body.fid} added SciFlow mini app`)
        break

      case 'frame_removed':
        // User removed the mini app
        console.log(`User ${body.fid} removed SciFlow mini app`)
        break

      case 'notifications_enabled':
        // User enabled notifications - store the notification token
        if (body.notificationDetails) {
          console.log(`User ${body.fid} enabled notifications`, {
            url: body.notificationDetails.url,
          })
          // TODO: Store notification token in database for sending push notifications
          // await db.insert({ fid: body.fid, notificationUrl: body.notificationDetails.url, token: body.notificationDetails.token })
        }
        break

      case 'notifications_disabled':
        // User disabled notifications
        console.log(`User ${body.fid} disabled notifications`)
        // TODO: Remove notification token from database
        break

      default:
        console.log('Unknown frame webhook event:', body)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Frame webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'SciFlow Frame Webhook',
  })
}
