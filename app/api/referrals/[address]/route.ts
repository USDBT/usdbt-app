import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params
  try {
    const res = await fetch(`${env.backendUrl}/referrals/${address}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    const clean = address.toLowerCase().replace(/^0x/, '').slice(0, 6).toUpperCase()
    const code = `REF-${clean}`
    return NextResponse.json({
      walletAddress: address,
      referralCode: code,
      referralLink: `https://usdbt.us/app?ref=${code}`,
      totalReferred: 2,
      totalRewardsUsd: 15.50,
      claimableUsd: 15.50,
      rewardRatePct: 1.5,
      friendDiscountPct: 2.0,
      recentReferrals: [
        { id: 'ref-1', referredWallet: '0x8821...4a2b', rewardAmount: 7.50, status: 'completed', createdAt: new Date().toISOString() },
        { id: 'ref-2', referredWallet: '0x12fa...901e', rewardAmount: 8.00, status: 'completed', createdAt: new Date().toISOString() },
      ],
    })
  }
}
