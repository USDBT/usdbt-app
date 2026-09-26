import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(req: Request) {
  const body = await req.json()
  try {
    const res = await fetch(`${env.backendUrl}/loyalty/calculate-discount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    const faceValue = Number(body.faceValue) || 0
    const points = Number(body.points) || 0
    const discount = Math.min(points / 100, faceValue * 0.20)
    return NextResponse.json({
      availablePoints: points,
      pointsUsed: Math.floor(discount * 100),
      discountAmount: parseFloat(discount.toFixed(2)),
      remainingPrice: parseFloat((faceValue - discount).toFixed(2)),
    })
  }
}
