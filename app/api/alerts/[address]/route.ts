import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params
  try {
    const res = await fetch(`${env.backendUrl}/alerts/${address}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({
      alerts: [
        {
          id: 'alert-1',
          wallet_address: address,
          email: 'user@usdbt.us',
          brand_id: 'amazon',
          brand_name: 'Amazon',
          target_discount_pct: 5,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ],
    })
  }
}
