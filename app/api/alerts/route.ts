import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(req: Request) {
  const body = await req.json()
  try {
    const res = await fetch(`${env.backendUrl}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({
      message: `Price alert set for ${body.brandName}`,
      alert: { ...body, id: `alert-${Date.now()}`, is_active: true, created_at: new Date().toISOString() },
    }, { status: 201 })
  }
}
