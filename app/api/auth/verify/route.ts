import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    const upstream = await fetch(env.backendUrl + '/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await request.text(),
      cache: 'no-store',
    })
    return NextResponse.json(await upstream.json(), { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Could not verify the wallet signature.' }, { status: 502 })
  }
}