import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const submitVerificationSchema = z.object({
  documents: z.array(z.object({
    type: z.string(),
    url: z.string().url(),
    name: z.string(),
  })).min(1),
  requested_tier: z.enum(['basic', 'verified', 'trusted', 'institutional']),
  additional_info: z.string().max(2000).optional(),
})

/**
 * GET /api/labs/[id]/verification - Get lab verification status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: lab, error } = await supabase
      .from('labs')
      .select(`
        id,
        name,
        verification_tier,
        verification_documents,
        verification_submitted_at,
        verification_approved_at
      `)
      .eq('id', id)
      .single()

    if (error || !lab) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 })
    }

    return NextResponse.json({
      current_tier: lab.verification_tier,
      documents: lab.verification_documents,
      submitted_at: lab.verification_submitted_at,
      approved_at: lab.verification_approved_at,
      can_submit: lab.verification_tier === 'unverified' || !lab.verification_submitted_at,
    })
  } catch (error) {
    console.error('Error in GET /api/labs/[id]/verification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/labs/[id]/verification - Submit verification request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get lab and verify ownership
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('*')
      .eq('id', id)
      .single()

    if (labError || !lab) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 })
    }

    if (lab.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only submit verification for your own lab' }, { status: 403 })
    }

    // Check if already pending verification
    if (lab.verification_submitted_at && !lab.verification_approved_at) {
      return NextResponse.json({ error: 'Verification already pending' }, { status: 400 })
    }

    // Parse and validate body
    const body = await request.json()
    const validationResult = submitVerificationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { documents, requested_tier, additional_info } = validationResult.data

    // Update lab with verification documents
    const { error: updateError } = await supabase
      .from('labs')
      .update({
        verification_documents: {
          documents,
          requested_tier,
          additional_info,
          submitted_by: user.id,
        },
        verification_submitted_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Notify admins (in production, this would go to an admin queue)
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'verification_submitted',
      details: { lab_id: id, requested_tier },
    })

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: 'Verification Submitted',
      message: `Your verification request for ${requested_tier} tier has been submitted and is under review.`,
      data: { lab_id: id, requested_tier },
    })

    return NextResponse.json({
      success: true,
      message: 'Verification submitted successfully',
      requested_tier,
    })
  } catch (error) {
    console.error('Error in POST /api/labs/[id]/verification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const approveVerificationSchema = z.object({
  approved: z.boolean(),
  tier: z.enum(['basic', 'verified', 'trusted', 'institutional']).optional(),
  rejection_reason: z.string().max(500).optional(),
})

/**
 * PATCH /api/labs/[id]/verification - Approve/reject verification (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get lab
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('*, user:users!labs_user_id_fkey(id, email)')
      .eq('id', id)
      .single()

    if (labError || !lab) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 })
    }

    // Parse and validate body
    const body = await request.json()
    const validationResult = approveVerificationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { approved, tier, rejection_reason } = validationResult.data

    if (approved) {
      const newTier = tier || (lab.verification_documents as { requested_tier?: string })?.requested_tier || 'basic'

      // Approve verification
      const { error: updateError } = await supabase
        .from('labs')
        .update({
          verification_tier: newTier,
          verification_approved_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Notify lab owner
      await supabase.from('notifications').insert({
        user_id: lab.user_id,
        type: 'system',
        title: 'Verification Approved!',
        message: `Your lab has been verified at the ${newTier} tier.`,
        data: { lab_id: id, tier: newTier },
      })

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'verification_approved',
        details: { lab_id: id, tier: newTier, admin_id: user.id },
      })

      return NextResponse.json({
        success: true,
        approved: true,
        tier: newTier,
      })
    } else {
      // Reject verification
      const { error: updateError } = await supabase
        .from('labs')
        .update({
          verification_submitted_at: null,
          verification_documents: {
            ...(lab.verification_documents as object),
            rejection_reason,
            rejected_at: new Date().toISOString(),
            rejected_by: user.id,
          },
        })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Notify lab owner
      await supabase.from('notifications').insert({
        user_id: lab.user_id,
        type: 'system',
        title: 'Verification Not Approved',
        message: rejection_reason || 'Your verification request was not approved. Please review and resubmit.',
        data: { lab_id: id, rejection_reason },
      })

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'verification_rejected',
        details: { lab_id: id, rejection_reason, admin_id: user.id },
      })

      return NextResponse.json({
        success: true,
        approved: false,
        rejection_reason,
      })
    }
  } catch (error) {
    console.error('Error in PATCH /api/labs/[id]/verification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
