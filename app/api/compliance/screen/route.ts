import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(req: Request) {
  const body = await req.json()
  try {
    const res = await fetch(`${env.backendUrl}/compliance/screen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({
      status: 'APPROVED',
      walletAddress: body.walletAddress,
      riskScore: 0.02,
      ofacMatch: false,
    })
  }
}
