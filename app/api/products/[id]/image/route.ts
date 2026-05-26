import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const res = await fetch(`${env.backendUrl}/products/${encodeURIComponent(id)}/image`)
  if (!res.ok) return NextResponse.json({ error: 'image not found' }, { status: 404 })

  const contentType = res.headers.get('content-type') ?? 'image/png'
  const cacheControl = res.headers.get('cache-control') ?? 'public, max-age=3600'
  const body = await res.arrayBuffer()

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    },
  })
}
