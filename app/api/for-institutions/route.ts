import { NextRequest, NextResponse } from 'next/server'
import { sendInstitutionalInquiry } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, org, role, email, type, budget, message } = body

  if (!name || !org || !email) {
    return NextResponse.json({ error: 'Name, organization, and email are required' }, { status: 400 })
  }

  await sendInstitutionalInquiry({ name, org, role, email, type, budget, message })

  return NextResponse.json({ success: true })
}
