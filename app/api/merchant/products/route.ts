import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key') || ''
  try {
    const res = await fetch(`${env.backendUrl}/merchant/products`, {
      headers: { 'x-api-key': apiKey },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({
      count: 4,
      products: [
        { productId: 'amazon', name: 'Amazon', country: 'US', wholesaleDiscount: '2.5%', denominations: [10, 25, 50, 100] },
        { productId: 'apple', name: 'Apple', country: 'US', wholesaleDiscount: '2.5%', denominations: [15, 25, 50, 100] },
        { productId: 'uber', name: 'Uber & Eats', country: 'US', wholesaleDiscount: '2.5%', denominations: [25, 50, 100] },
        { productId: 'steam', name: 'Steam', country: 'US', wholesaleDiscount: '2.5%', denominations: [20, 50, 100] },
      ],
    })
  }
}
