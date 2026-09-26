import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key') || ''
  try {
    const res = await fetch(`${env.backendUrl}/merchant/me`, {
      headers: { 'x-api-key': apiKey },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Could not reach the server. Try again.' }, { status: 502 })
  }
}
