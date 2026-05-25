import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${env.backendUrl}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const res = await fetch(`${env.backendUrl}/orders/${id}`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
