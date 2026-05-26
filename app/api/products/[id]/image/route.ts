import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  const backendPath = `/products/${encodeURIComponent(id)}/image${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`
  const res = await fetch(`${env.backendUrl}${backendPath}`)
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
