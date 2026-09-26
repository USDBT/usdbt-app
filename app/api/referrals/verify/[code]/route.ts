import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  try {
    const res = await fetch(`${env.backendUrl}/referrals/verify/${code}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    const valid = code.toUpperCase().startsWith('REF-')
    return NextResponse.json({ valid, discountPct: valid ? 2.0 : 0 })
  }
}
