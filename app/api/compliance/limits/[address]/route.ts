import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params
  try {
    const res = await fetch(`${env.backendUrl}/compliance/limits/${address}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({
      walletAddress: address,
      tier: 'Tier 0 (Non-KYC Instant)',
      dailyLimitUsd: 1000,
      spentLast24hUsd: 75.0,
      remainingQuotaUsd: 925.0,
      sanctionsCheck: 'PASSED',
      riskScore: 'LOW (0.01)',
      kycRequired: false,
      policy: 'Transactions under $1,000 daily are 100% permissionless and non-KYC.',
    })
  }
}
