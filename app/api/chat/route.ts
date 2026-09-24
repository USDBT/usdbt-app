import { NextRequest } from 'next/server'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const upstream = await fetch(env.backendUrl + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: await request.text(),
      cache: 'no-store',
    })

    const headers = new Headers()
    headers.set('Content-Type', upstream.headers.get('content-type') ?? 'text/event-stream; charset=utf-8')
    headers.set('Cache-Control', 'no-cache, no-transform')
    headers.set('X-Accel-Buffering', 'no')

    return new Response(upstream.body, { status: upstream.status, headers })
  } catch {
    return Response.json({ error: 'Could not reach the shopping assistant.' }, { status: 502 })
  }
}