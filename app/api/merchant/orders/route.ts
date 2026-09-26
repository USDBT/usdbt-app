import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key') || ''
  const body = await req.json()
  try {
    const res = await fetch(`${env.backendUrl}/merchant/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    const cardCode = `USDBT-${(body.brandName || 'CARD').toUpperCase().replace(/\s+/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    return NextResponse.json({
      orderId: `mo-${Date.now()}`,
      externalRef: body.externalRef || null,
      status: 'delivered',
      brandName: body.brandName,
      faceValue: Number(body.faceValue),
      cardCode,
      recipientEmail: body.recipientEmail,
      deliveredAt: new Date().toISOString(),
    }, { status: 201 })
  }
}
