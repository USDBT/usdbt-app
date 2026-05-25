const BASE = 'https://api.bitrefill.com/v2'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.BITREFILL_API_KEY}`,
      ...options?.headers,
    },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`Bitrefill ${path} ${res.status}: ${JSON.stringify(body)}`)
  return body as T
}

export interface BitrefillProduct {
  id: string
  name: string
  type: string
  denominations: number[]
  range: { min: number; max: number; step: number } | null
  country: string
  currency: string
  image: string
}

export interface BitrefillInvoice {
  id: string
  status: string
  orders?: Array<{
    id: string
    codes?: Array<{ code: string; type: string; pin?: string }>
    redemptionInfo?: string
  }>
}

export async function listProducts(page = 0): Promise<{ products: BitrefillProduct[] }> {
  return req(`/products?page=${page}&per_page=100&type=giftcard`)
}

export async function getProduct(id: string): Promise<BitrefillProduct> {
  return req(`/products/${id}`)
}

export async function createInvoice(
  productId: string,
  value: number,
  quantity: number,
): Promise<BitrefillInvoice> {
  return req('/invoices', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, value, quantity, payment_method: 'balance' }),
  })
}

export async function payInvoice(invoiceId: string): Promise<BitrefillInvoice> {
  return req(`/invoices/${invoiceId}/pay`, { method: 'POST' })
}

export async function getInvoice(invoiceId: string): Promise<BitrefillInvoice> {
  return req(`/invoices/${invoiceId}`)
}

export async function getBalance(): Promise<{ balance: number; currency: string }> {
  return req('/balance')
}
