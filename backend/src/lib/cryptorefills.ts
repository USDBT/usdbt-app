const BASE = 'https://api.cryptorefills.com'
const APP_VERSION = '1.0.0'

export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`[config] Missing required env var: ${name}`)
  return value
}

function crHeaders(userIp = '127.0.0.1', userAgent = 'usdbt-backend/1.0') {
  return {
    'Content-Type': 'application/json',
    'X-Cr-Application': requiredEnv('CRYPTOREFILLS_PARTNER_ID'),
    'X-Cr-Version': APP_VERSION,
    'X-Forwarded-For': userIp,
    'User-Agent': userAgent,
  }
}

async function crFetch<T>(
  path: string,
  opts: RequestInit & { userIp?: string; userAgent?: string } = {},
): Promise<T> {
  const { userIp, userAgent, ...init } = opts
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...crHeaders(userIp, userAgent), ...(init.headers as object ?? {}) },
  })
  if (!res.ok) {
    let detail = ''
    try { detail = JSON.stringify(await res.json()) } catch { detail = await res.text() }
    throw new Error(`Cryptorefills ${path} ${res.status}: ${detail}`)
  }
  return res.json() as Promise<T>
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface CRBrand {
  family_name: string
  brand_name: string
  logo_url?: string
  logo_base_url?: string
  categories?: string[]
  countries?: string[]
}

export interface CRProductOption {
  product_id: string
  denomination: string            // e.g. "5 USD", "10 USD"
  coin_amount: string             // exact USDC amount e.g. "5.32"
  is_dynamic: boolean             // true = range/variable product
  face_value: {
    currency_code: string
    amount: {
      type: 'fixed' | 'range'
      price?: string              // for fixed
      min_price?: string          // for range
      max_price?: string
      step?: string
    }
  }
}

export interface CROrder {
  id: string
  status: string
  wallet_address: string
  coin_amount: number | string
  coin?: string
  network?: string
  expires_at?: string
}

export interface CROrderInput {
  brandName: string
  countryCode: string
  denomination: string | number   // face value or 'range'
  productValue?: number           // only when denomination === 'range'
  email: string
  userIp: string
  userAgent: string
}

// ── Catalog ──────────────────────────────────────────────────────────────────

export async function listBrands(countryCode = 'US'): Promise<CRBrand[]> {
  const raw = await crFetch<any>(`/v2/brands?country_code=${countryCode}`)

  // Response: { categories: [{ kind, category, brands: [...] }] }
  const categories: any[] = raw.categories ?? []
  const seen = new Set<string>()
  const brands: CRBrand[] = []

  for (const cat of categories) {
    if (cat.kind !== 'giftcard') continue   // skip mobile_recharge, nft_giftcard etc.
    for (const b of (cat.brands ?? [])) {
      const key = String(b.family ?? b.brand ?? '')
      if (!key || seen.has(key)) continue   // deduplicate across categories
      seen.add(key)
      brands.push({
        family_name: key,
        brand_name: String(b.brand ?? key),
        logo_url: b.logo_url,
        logo_base_url: b.logo_base_url,
        categories: [cat.category],
      })
    }
  }

  return brands
}

export async function getProductOptions(
  familyName: string,
  countryCode = 'US',
): Promise<CRProductOption[]> {
  const raw = await crFetch<any>(
    `/v5/products/country/${countryCode}?family_name=${encodeURIComponent(familyName)}&coin=USDC&lang=en`,
  )
  // Response: [{country_code, category, kind, products: [{product_id, denomination, coin_amount, ...}]}]
  const wrappers: any[] = Array.isArray(raw) ? raw : [raw]
  return wrappers.flatMap((w) => w.products ?? []) as CRProductOption[]
}

// ── Orders ───────────────────────────────────────────────────────────────────

function buildOrderBody(input: CROrderInput) {
  const isRange = input.denomination === 'range'
  const deliverable: Record<string, unknown> = {
    brand_name: input.brandName,
    country_code: input.countryCode,
    denomination: isRange ? 'range' : String(input.denomination),
    beneficiary_account: input.email,
  }
  if (isRange && input.productValue != null) {
    deliverable.product_value = input.productValue
    deliverable.localized_denomination = '$'
  }
  return {
    deliveries: [{ kind: 'giftcard', quantity: 1, deliverable }],
    payment: {
      type: 'via',
      coin: 'USDC',
      network: 'Base',
      payment_via: 'USER_WALLET',
    },
    user: { email: input.email, has_accepted_newsletter: false },
    lang: 'en',
    acquisition: { utm_source: 'usdbt' },
  }
}

export async function validateOrder(
  input: CROrderInput,
): Promise<{ ok: boolean; problems: Array<{ problem: string; moreDetails?: string }> }> {
  const raw = await crFetch<any>('/v5/orders/validations', {
    method: 'POST',
    body: JSON.stringify(buildOrderBody(input)),
    userIp: input.userIp,
    userAgent: input.userAgent,
  })
  const problems = raw.problems ?? []
  return { ok: problems.length === 0, problems }
}

export async function createCROrder(input: CROrderInput): Promise<CROrder> {
  return crFetch<CROrder>('/v5/orders', {
    method: 'POST',
    body: JSON.stringify(buildOrderBody(input)),
    userIp: input.userIp,
    userAgent: input.userAgent,
  })
}

export async function getCROrder(crOrderId: string): Promise<CROrder> {
  return crFetch<CROrder>(`/v5/orders/${crOrderId}`)
}
