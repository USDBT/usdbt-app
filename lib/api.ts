export interface Product {
  id: string          // family_name from Cryptorefills
  name: string        // brand display name
  type: string
  categories?: string[]
  denominations: number[]
  range: { min: number; max: number; step: number } | null
  country: string
  countryCode: string
  currency: string
  image: string
  imageKey?: string
}

export function titleize(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizeProduct(raw: any): Product {
  const denominations = Array.isArray(raw?.denominations)
    ? raw.denominations.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n))
    : []

  const range = raw?.range && typeof raw.range === 'object'
    ? {
        min: Number(raw.range.min ?? 0),
        max: Number(raw.range.max ?? 0),
        step: Number(raw.range.step ?? 1),
      }
    : null

  const image = String(raw?.image ?? raw?.logo_url ?? '')

  return {
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? 'Unknown'),
    type: String(raw?.type ?? 'gift_card'),
    categories: Array.isArray(raw?.categories) ? raw.categories.map((c: any) => String(c)) : [],
    denominations,
    range: range && range.min > 0 && range.max > 0 ? range : null,
    country: String(raw?.country ?? ''),
    countryCode: String(raw?.countryCode ?? raw?.country_code ?? 'US'),
    currency: String(raw?.currency ?? 'USD'),
    image,
    imageKey: raw?.imageKey ?? undefined,
  }
}

export interface WalletBalances {
  usdc: string
  usdbt: string
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
  status:
    | 'pending_payment'
    | 'user_debited'
    | 'hot_wallet_funded'
    | 'bitrefill_processing'
    | 'delivered'
    | 'failed'
    | 'refunded'
  brandName: string
  faceValue: number
  paymentAmount: number
  currency: string
  paymentAddress?: string
  txHash: string | null
  expiresAt: string
  estimatedReadyAt?: string | null
  deliveredAt?: string | null
  failureReason?: string | null
  progress?: {
    step: number
    totalSteps: number
    label: string
    terminal: boolean
  }
}

export interface OrderProgress {
  orderId: string
  status: OrderStatus['status']
  progress: {
    step: number
    totalSteps: number
    label: string
    terminal: boolean
  }
  estimatedReadyAt?: string | null
  failureReason?: string | null
}

export function priceLabel(p: Product): string {
  if (p.denominations.length > 0) return `From $${Math.min(...p.denominations)}`
  if (p.range) return `$${p.range.min}–$${p.range.max}`
  return 'Variable'
}

export async function fetchProducts(_page = 0): Promise<Product[]> {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('failed to load products')
  const data = await res.json()
  const list = data.products ?? data.items ?? data.data ?? (Array.isArray(data) ? data : [])
  return Array.isArray(list) ? list.map(normalizeProduct).filter((p) => !!p.id) : []
}

export async function fetchProductDetail(familyName: string): Promise<{
  denominations: number[]
  range: Product['range']
  coinAmounts: Record<number, number>
}> {
  const res = await fetch(`/api/products/${encodeURIComponent(familyName)}`)
  if (!res.ok) throw new Error('failed to load product details')
  const data = await res.json()
  const denominations = Array.isArray(data.denominations)
    ? data.denominations.map(Number).filter(Number.isFinite)
    : []
  const range = data.range && data.range.max > 0
    ? { min: Number(data.range.min), max: Number(data.range.max), step: Number(data.range.step ?? 1) }
    : null
  const coinAmounts: Record<number, number> = data.coinAmounts ?? {}
  return { denominations, range, coinAmounts }
}

export async function createOrder(body: {
  brandName: string
  familyName: string
  countryCode: string
  denomination: string | number
  productValue?: number
  faceValue: number
  email: string
  walletAddress: string
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

export async function getOrderProgress(orderId: string): Promise<OrderProgress> {
  const res = await fetch(`/api/orders/${orderId}/progress`)
  if (!res.ok) throw new Error('order not found')
  return res.json()
}

export async function getWalletBalances(address: string): Promise<WalletBalances> {
  const res = await fetch(`/api/balances/${address}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'failed to load balances')
  return data
}

export interface OrderStats {
  totalOrders: number
  recentOrders: Array<{
    id: string
    brandName: string
    faceValue: number
    coinAmount: number
    status: OrderStatus['status']
    createdAt: string
  }>
  ordersByDay: Array<{ label: string; count: number }>
  statusMix: { completed: number; pending: number; failed: number }
  totalSpentUsdc: number
  topBrands: Array<{ label: string; value: number }>
}

export async function getOrderStats(address: string, authHeader: Record<string, string>): Promise<OrderStats> {
  const res = await fetch(`/api/users/${address}/stats`, { headers: authHeader })
  if (!res.ok) throw new Error('failed to load stats')
  return res.json()
}
