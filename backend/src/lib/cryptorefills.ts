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
  denomination: string | number   // "25" | "range"
  face_value?: number
  min?: number
  max?: number
  step?: number
  currency?: string
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
  const list: any[] = Array.isArray(raw) ? raw : (raw.brands ?? raw.data ?? raw.items ?? [])
  return list as CRBrand[]
}

export async function getProductOptions(
  familyName: string,
  countryCode = 'US',
): Promise<CRProductOption[]> {
  const raw = await crFetch<any>(
    `/v5/products/country/${countryCode}?family_name=${encodeURIComponent(familyName)}&coin=USDC&lang=en`,
  )
  const list: any[] = Array.isArray(raw) ? raw : (raw.products ?? raw.data ?? raw.items ?? [])
  return list as CRProductOption[]
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
