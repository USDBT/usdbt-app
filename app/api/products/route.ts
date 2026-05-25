import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = searchParams.get('page') ?? '0'
  const res = await fetch(`${env.backendUrl}/products?page=${page}`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
