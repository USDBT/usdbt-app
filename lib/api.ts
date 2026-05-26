export interface Product {
  id: string
  name: string
  type: string
  categories?: string[]
  denominations: number[]
  range: { min: number; max: number; step: number } | null
  country: string
  countryCode?: string
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

// Manual overrides for brands where name→domain heuristic fails
const DOMAIN_OVERRIDES: Record<string, string> = {
  'steam':             'steampowered.com',
  'google play':       'play.google.com',
  'xbox':              'xbox.com',
  'playstation':       'playstation.com',
  'battle.net':        'battle.net',
  'battlenet':         'battle.net',
  'at&t':              'att.com',
  'twitch':            'twitch.tv',
  'youtube':           'youtube.com',
  'disney':            'disneyplus.com',
  'hbo':               'hbomax.com',
  'foot locker':       'footlocker.com',
  "macy's":            'macys.com',
  'west elm':          'westelm.com',
  'bloomin':           'bloominbrands.com',
  "ruth's chris":      'ruthschris.com',
}

function brandLogoUrl(name: string): string {
  const lower = name.toLowerCase()

  for (const [key, domain] of Object.entries(DOMAIN_OVERRIDES)) {
    if (lower.includes(key)) return `https://logo.clearbit.com/${domain}`
  }

  // Strip country / product-type suffixes and derive domain
  const clean = name
    .replace(/\b(usa|uk|us|ca|canada|global|worldwide|international|pin|prepaid|recharge|store)\b/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
  const slug = clean.replace(/\s+/g, '').toLowerCase()
  if (slug.length >= 3) return `https://logo.clearbit.com/${slug}.com`

  return ''
}

function normalizeProduct(raw: any): Product {
  const packageAmounts = Array.isArray(raw?.packages)
    ? raw.packages
        .map((pkg: any) => Number(pkg?.amount ?? pkg?.value))
        .filter((n: number) => Number.isFinite(n))
    : []

  const denominations = Array.isArray(raw?.denominations)
    ? raw.denominations
    : Array.isArray(raw?.fixed_denominations)
      ? raw.fixed_denominations
      : packageAmounts

  const range = raw?.range && typeof raw.range === 'object'
    ? {
        min: Number(raw.range.min ?? raw.range.minimum ?? 0),
        max: Number(raw.range.max ?? raw.range.maximum ?? 0),
        step: Number(raw.range.step ?? 1),
      }
    : null

  // Bitrefill v2 `image` field is an internal token slug, not a URL.
  // Their CDN is signed-URL restricted. Use Clearbit logo API instead.
  const imageValue = raw?.image
  const rawImage =
    typeof imageValue === 'string'
      ? imageValue
      : typeof imageValue === 'object' && imageValue
        ? String(imageValue.url ?? imageValue.src ?? imageValue.logo ?? '')
        : String(raw?.image_url ?? raw?.logo ?? raw?.logo_url ?? '')

  const image = /^https?:\/\//i.test(rawImage)
    ? rawImage                           // already a full URL — use it
    : brandLogoUrl(String(raw?.name ?? ''))  // derive from brand name via Clearbit

  const name = String(raw?.name ?? 'Unknown')

  return {
    id: String(raw?.id ?? ''),
    name,
    type: String(raw?.type ?? raw?.categories?.[0] ?? 'gift_card'),
    categories: Array.isArray(raw?.categories) ? raw.categories.map((c: any) => String(c)) : [],
    denominations: denominations.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n)),
    range: range && Number.isFinite(range.min) && Number.isFinite(range.max) ? range : null,
    country: String(raw?.country_name ?? raw?.country ?? ''),
    countryCode: String(raw?.country_code ?? ''),
    currency: String(raw?.currency ?? ''),
    image,
    imageKey: rawImage || undefined,
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
  if (Array.isArray(p.denominations) && p.denominations.length > 0) return `From $${Math.min(...p.denominations)}`
  if (p.range) return `$${p.range.min}–$${p.range.max}`
  return 'Variable'
}

export async function fetchProducts(page = 0): Promise<Product[]> {
  const res = await fetch(`/api/products?page=${page}`)
  if (!res.ok) throw new Error('failed to load products')
  const data = await res.json()
  const list = data.products ?? data.items ?? data.data ?? (Array.isArray(data) ? data : [])
  return Array.isArray(list) ? list.map(normalizeProduct).filter((p) => !!p.id) : []
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
