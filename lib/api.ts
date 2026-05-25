export interface Product {
  id: string
  name: string
  type: string
  denominations: number[]
  range: { min: number; max: number; step: number } | null
  country: string
  currency: string
  image: string
}

export interface OrderCreated {
  orderId: string
  paymentAddress: string
  paymentAmount: number
  currency: string
  expiresAt: string
}

export interface OrderStatus {
  orderId: string
  status: 'pending_payment' | 'confirming' | 'fulfilled' | 'failed'
  brandName: string
  faceValue: number
  paymentAmount: number
  currency: string
  txHash: string | null
  expiresAt: string
}

export function priceLabel(p: Product): string {
  if (p.denominations.length > 0) return `From $${Math.min(...p.denominations)}`
  if (p.range) return `$${p.range.min}–$${p.range.max}`
  return 'Variable'
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('failed to load products')
  const data = await res.json()
  return data.products ?? []
}

export async function createOrder(body: {
  productId: string
  value: number
  email: string
  walletAddress: string
  currency: string
}): Promise<OrderCreated> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'failed to create order')
  return data
}

export async function getOrderStatus(orderId: string): Promise<OrderStatus> {
  const res = await fetch(`/api/orders/${orderId}`)
  if (!res.ok) throw new Error('order not found')
  return res.json()
}
