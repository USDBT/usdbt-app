import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const res = await fetch(`${env.backendUrl}/alerts/${id}`, { method: 'DELETE' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Could not reach the server. Try again.' }, { status: 502 })
  }
}
