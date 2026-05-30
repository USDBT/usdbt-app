import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  const auth = req.headers.get('authorization') ?? ''
  const res = await fetch(`${env.backendUrl}/users/${encodeURIComponent(address)}/stats`, {
    headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
