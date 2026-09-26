import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params
  try {
    const res = await fetch(`${env.backendUrl}/loyalty/${address}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({
      walletAddress: address,
      pointsBalance: 150,
      lifetimePoints: 450,
      tier: 'bronze',
      multiplier: 1.0,
      perkDiscountPct: 0,
      nextTierThreshold: 1000,
      pointsToNextTier: 550,
      transactions: [
        { id: '1', points_delta: 100, action: 'welcome_bonus', created_at: new Date().toISOString() },
        { id: '2', points_delta: 50, action: 'earn_order', created_at: new Date().toISOString() },
      ],
    })
  }
}
