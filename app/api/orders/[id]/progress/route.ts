import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const res = await fetch(`${env.backendUrl}/orders/${id}/progress`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

