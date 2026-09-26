import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key') || ''
  const body = await req.json()
  try {
    const res = await fetch(`${env.backendUrl}/merchant/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Could not reach the server. Try again.' }, { status: 502 })
  }
}
