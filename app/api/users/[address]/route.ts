import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(request: NextRequest, context: { params: Promise<{ address: string }> }) {
  const { address } = await context.params
  try {
    const authorization = request.headers.get('authorization')
    const upstream = await fetch(env.backendUrl + '/users/' + encodeURIComponent(address), {
      headers: authorization ? { Authorization: authorization } : {},
      cache: 'no-store',
    })
    // An unregistered wallet is a normal state (first visit), not an error: answer 200 with no user
    if (upstream.status === 404) return NextResponse.json({ user: null })
    return NextResponse.json(await upstream.json(), { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Could not load the account.' }, { status: 502 })
  }
}