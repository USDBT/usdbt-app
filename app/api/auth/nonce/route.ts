import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })
  try {
    const upstream = await fetch(env.backendUrl + '/auth/nonce?address=' + encodeURIComponent(address), {
      cache: 'no-store',
    })
    return NextResponse.json(await upstream.json(), { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Could not request an authentication nonce.' }, { status: 502 })
  }
}