import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET() {
  try {
    const res = await fetch(`${env.backendUrl}/products`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[products] backend unreachable at', env.backendUrl, err)
    return NextResponse.json({ error: 'Could not load gift cards.' }, { status: 502 })
  }
}
