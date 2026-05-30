import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET() {
  const res = await fetch(`${env.backendUrl}/products`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
