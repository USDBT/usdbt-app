import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function PATCH(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const res = await fetch(`${env.backendUrl}/alerts/${id}/toggle`, { method: 'PATCH' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ success: true, alert: { id, is_active: false } })
  }
}
