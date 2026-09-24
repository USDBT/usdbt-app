import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    const upstream = await fetch(env.backendUrl + '/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: await request.text(),
      cache: 'no-store',
    })
    return NextResponse.json(await upstream.json(), { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Could not save the account email.' }, { status: 502 })
  }
}