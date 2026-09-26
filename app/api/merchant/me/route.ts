import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key') || ''
  try {
    const res = await fetch(`${env.backendUrl}/merchant/me`, {
      headers: { 'x-api-key': apiKey },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({
      merchant: {
        id: 'merchant-demo',
        name: 'Demo Store',
        walletAddress: '0x1234567890123456789012345678901234567890',
        apiKey: apiKey || 'sk_live_demo1234567890abcdef',
        webhookUrl: 'https://myshop.com/webhooks/cards',
        totalVolume: 1250,
      },
      orders: [
        {
          id: 'mo-1',
          external_ref: 'ORDER-1001',
          product_id: 'amazon',
          brand_name: 'Amazon',
          face_value: 50,
          recipient_email: 'buyer@shop.com',
          status: 'delivered',
          card_code: 'USDBT-AMAZON-89F12A',
          created_at: new Date().toISOString(),
        },
      ],
    })
  }
}
