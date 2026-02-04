import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const supabase = await createClient()

    console.log('Frame webhook received:', {
      event: body.event,
      fid: body.fid,
      timestamp: new Date(body.timestamp * 1000).toISOString(),
    })

    switch (body.event) {
      case 'frame_added':
        // User added the mini app - log this event
        await supabase.from('activity_logs').insert({
          action: 'frame_added',
          details: {
            fid: body.fid,
            timestamp: body.timestamp,
          },
        })
        console.log(`User ${body.fid} added SciFlow mini app`)
        break

      case 'frame_removed':
        // User removed the mini app
        await supabase.from('activity_logs').insert({
          action: 'frame_removed',
          details: {
            fid: body.fid,
            timestamp: body.timestamp,
          },
        })
        // Remove notification token if exists
        await supabase
          .from('frame_notification_tokens')
          .delete()
          .eq('fid', body.fid)
        console.log(`User ${body.fid} removed SciFlow mini app`)
        break

      case 'notifications_enabled':
        // User enabled notifications - store the notification token
        if (body.notificationDetails) {
          // Upsert the notification token
          await supabase
            .from('frame_notification_tokens')
            .upsert({
              fid: body.fid,
              notification_url: body.notificationDetails.url,
              notification_token: body.notificationDetails.token,
              enabled: true,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'fid',
            })

          await supabase.from('activity_logs').insert({
            action: 'frame_notifications_enabled',
            details: {
              fid: body.fid,
              notification_url: body.notificationDetails.url,
            },
          })

          console.log(`User ${body.fid} enabled notifications`)
        }
        break

      case 'notifications_disabled':
        // User disabled notifications - mark token as disabled
        await supabase
          .from('frame_notification_tokens')
          .update({
            enabled: false,
            updated_at: new Date().toISOString(),
          })
          .eq('fid', body.fid)

        await supabase.from('activity_logs').insert({
          action: 'frame_notifications_disabled',
          details: {
            fid: body.fid,
          },
        })

        console.log(`User ${body.fid} disabled notifications`)
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
