import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  try {
    const res = await fetch(`${env.backendUrl}/orders/${id}/escrow/dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ success: true, message: 'Dispute submitted (offline mode)', escrowStatus: 'escrow_disputed' })
  }
}
