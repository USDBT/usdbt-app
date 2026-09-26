import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    const res = await fetch(`${env.backendUrl}/rewards/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) },
      cache: 'no-store',
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Could not reach the server. Try again.' }, { status: 502 })
  }
}
