import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(_: Request, context: { params: Promise<{ address: string }> }) {
  const { address } = await context.params
  const res = await fetch(`${env.backendUrl}/balances/${encodeURIComponent(address)}`)
  const data = await res.json()
  if (process.env.SIMULATE === 'true') {
    data.simulated = true
  }
  return NextResponse.json(data, { status: res.status })
}
