/**
 * Email notifications via Resend.
 * Falls back to console logging if RESEND_API_KEY is not set.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = 'SciFlow <notifications@sciflowlabs.com>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sciflowlabs.com'

interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
}

async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log('[Email] No RESEND_API_KEY — would have sent:', payload.subject, '→', payload.to)
    return { ok: true }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, ...payload }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[Email] Resend error:', text)
      return { ok: false, error: text }
    }

    return { ok: true }
  } catch (err) {
    console.error('[Email] Send failed:', err)
    return { ok: false, error: String(err) }
  }
}

// ── Admin notifications ──────────────────────────────────────────

export async function notifyAdminNewBounty(bounty: {
  id: string
  title: string
  funderEmail: string
  budget: number
  currency: string
  openClawScore: number
  openClawDecision: string
  signals: Array<{ type: string; severity: string; message: string }>
}) {
  const signalRows = bounty.signals.length
    ? bounty.signals.map(s =>
        `<tr><td style="padding:4px 8px;color:${s.severity === 'high' ? '#ef4444' : s.severity === 'medium' ? '#f59e0b' : '#6b7280'}">${s.severity.toUpperCase()}</td><td style="padding:4px 8px">${s.message}</td></tr>`
      ).join('')
    : '<tr><td colspan="2" style="padding:4px 8px;color:#6b7280">No signals — clean submission</td></tr>'

  const decisionColor = bounty.openClawDecision === 'allow' ? '#10b981'
    : bounty.openClawDecision === 'reject' ? '#ef4444' : '#f59e0b'

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[SciFlow] New bounty needs review: "${bounty.title}"`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f5f3ef;padding:32px;border-radius:12px">
        <h2 style="margin:0 0 8px;font-size:20px">New Bounty Submitted</h2>
        <p style="color:#8c8c8c;margin:0 0 24px">Requires admin review before labs can see it.</p>
        
        <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin-bottom:16px">
          <div style="font-size:18px;font-weight:600;margin-bottom:4px">${bounty.title}</div>
          <div style="color:#8c8c8c">by ${bounty.funderEmail}</div>
          <div style="color:#8c8c8c">Budget: ${bounty.budget.toLocaleString()} ${bounty.currency}</div>
        </div>
        
        <div style="margin-bottom:16px">
          <div style="font-size:13px;color:#8c8c8c;margin-bottom:8px">OPENCLAW RESULT</div>
          <div style="display:inline-block;padding:4px 12px;border-radius:100px;background:${decisionColor}22;color:${decisionColor};font-weight:600;font-size:13px">
            ${bounty.openClawDecision.toUpperCase()} — Score: ${bounty.openClawScore}/100
          </div>
        </div>
        
        ${bounty.signals.length > 0 ? `
        <div style="margin-bottom:24px">
          <div style="font-size:13px;color:#8c8c8c;margin-bottom:8px">RISK SIGNALS</div>
          <table style="width:100%;border-collapse:collapse;background:#1a1a1a;border-radius:8px;overflow:hidden">
            ${signalRows}
          </table>
        </div>` : ''}
        
        <a href="https://sciflowlabs.com/admin?bountyId=${bounty.id}" 
           style="display:inline-block;background:#f5f3ef;color:#121212;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Review in Admin Dashboard →
        </a>
        
        <p style="color:#4a4a4a;font-size:12px;margin-top:24px">
          SciFlow · sciflowlabs.com
        </p>
      </div>
    `,
  })
}

export async function notifyFunderBountyApproved(bounty: { id: string; title: string; funderEmail: string }) {
  return sendEmail({
    to: bounty.funderEmail,
    subject: `[SciFlow] Your bounty is approved and live: "${bounty.title}"`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f5f3ef;padding:32px;border-radius:12px">
        <h2 style="margin:0 0 8px">Bounty Approved ✓</h2>
        <p style="color:#8c8c8c">Your bounty is now visible to verified labs. Proposals will start arriving once labs discover it.</p>
        <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin:24px 0">
          <div style="font-size:18px;font-weight:600">${bounty.title}</div>
        </div>
        <a href="https://sciflowlabs.com/dashboard/bounties/${bounty.id}"
           style="display:inline-block;background:#f5f3ef;color:#121212;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          View Bounty →
        </a>
      </div>
    `,
  })
}

export async function notifyFunderBountyRejected(bounty: { id: string; title: string; funderEmail: string; reason: string }) {
  return sendEmail({
    to: bounty.funderEmail,
    subject: `[SciFlow] Bounty needs revision: "${bounty.title}"`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f5f3ef;padding:32px;border-radius:12px">
        <h2 style="margin:0 0 8px">Bounty Needs Revision</h2>
        <p style="color:#8c8c8c">Your bounty requires changes before it can go live.</p>
        <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin:24px 0">
          <div style="font-size:18px;font-weight:600;margin-bottom:8px">${bounty.title}</div>
          <div style="color:#ef4444;font-size:14px"><strong>Reason:</strong> ${bounty.reason}</div>
        </div>
        <a href="https://sciflowlabs.com/dashboard/bounties/${bounty.id}"
           style="display:inline-block;background:#f5f3ef;color:#121212;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Edit &amp; Resubmit →
        </a>
      </div>
    `,
  })
}

export async function sendInstitutionalInquiry(data: {
  name: string; org: string; role?: string; email: string
  type?: string; budget?: string; message?: string
}) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[SciFlow] Institutional inquiry from ${data.org}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f5f3ef;padding:32px;border-radius:12px">
        <h2 style="margin:0 0 8px">New Institutional Inquiry</h2>
        <p style="color:#8c8c8c;margin:0 0 24px">Someone wants to fund research on SciFlow.</p>
        <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin-bottom:16px;font-size:14px">
          <div><strong>${data.name}</strong>${data.role ? ` — ${data.role}` : ''}</div>
          <div style="color:#8c8c8c">${data.org}</div>
          <div style="color:#8c8c8c">${data.email}</div>
          ${data.type ? `<div style="color:#8c8c8c;margin-top:4px">Type: ${data.type}</div>` : ''}
          ${data.budget ? `<div style="color:#8c8c8c">Budget: ${data.budget}</div>` : ''}
        </div>
        ${data.message ? `<div style="background:#1a1a1a;border-radius:8px;padding:16px;font-size:14px;color:#8c8c8c;white-space:pre-wrap">${data.message}</div>` : ''}
        <div style="margin-top:24px">
          <a href="mailto:${data.email}" style="display:inline-block;background:#f5f3ef;color:#121212;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Reply to ${data.name} →
          </a>
        </div>
      </div>
    `,
  })
}
