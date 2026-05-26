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

function encodePathPreservingSlashes(value: string): string {
  return value
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
}

async function reqRaw(path: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.BITREFILL_API_KEY}`,
      ...options?.headers,
    },
  })
  if (!res.ok) {
    let details = ''
    try {
      details = JSON.stringify(await res.clone().json())
    } catch {
      details = await res.text()
    }
    throw new Error(`Bitrefill ${path} ${res.status}: ${details}`)
  }
  return res
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
  const variants = [
    `/products?page=${page}&per_page=100&type=giftcard`,
    `/products?page=${page}&per_page=100&type=gift_card`,
    `/products?page=${page}&per_page=100`,
  ]
  const errors: string[] = []

  for (const path of variants) {
    try {
      const raw = await req<any>(path)
      // Bitrefill v2 returns {meta, data:[...]}
      if (Array.isArray(raw?.data)) return { products: raw.data as BitrefillProduct[] }
      if (Array.isArray(raw?.products)) return { products: raw.products as BitrefillProduct[] }
      if (Array.isArray(raw?.items)) return { products: raw.items as BitrefillProduct[] }
      if (Array.isArray(raw)) return { products: raw as BitrefillProduct[] }
      errors.push(`Unexpected response shape for ${path}: ${JSON.stringify(raw).slice(0, 200)}`)
    } catch (err) {
      errors.push(`Request failed for ${path}: ${String(err)}`)
    }
  }

  throw new Error(`Bitrefill products lookup failed. ${errors.join(' | ')}`)
}

export async function getProduct(id: string): Promise<BitrefillProduct> {
  return req(`/products/${id}`)
}

export async function getProductImage(token: string): Promise<Response> {
  return reqRaw(`/products/${encodePathPreservingSlashes(token)}/image`)
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
