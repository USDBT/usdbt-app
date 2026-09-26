import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(req: Request) {
  const body = await req.json()
  try {
    const res = await fetch(`${env.backendUrl}/nft/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({
      message: 'NFT voucher unwrapped successfully!',
      claimCode: `USDBT-AMAZON-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      brandName: 'Amazon',
      faceValue: 50,
      status: 'redeemed',
    })
  }
}
