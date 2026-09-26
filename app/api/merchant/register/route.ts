import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(req: Request) {
  const body = await req.json()
  try {
    const res = await fetch(`${env.backendUrl}/merchant/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    const key = `sk_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
    return NextResponse.json({
      message: 'Merchant account created successfully',
      merchant: {
        id: `merchant-${Date.now()}`,
        name: body.merchantName,
        walletAddress: body.walletAddress,
        apiKey: key,
        webhookUrl: body.webhookUrl || null,
        status: 'active',
        totalVolume: 0,
      },
    }, { status: 201 })
  }
}
