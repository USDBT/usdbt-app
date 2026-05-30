import { Router } from 'express'
import { listBrands, getProductOptions, type CRBrand, type CRProductOption } from '../lib/cryptorefills'

export const productsRouter = Router()

// ── In-memory cache ───────────────────────────────────────────────────────────

interface CachedBrands { data: any[]; expiresAt: number }
let brandsCache: CachedBrands | null = null
const BRANDS_TTL_MS = 60 * 60 * 1000   // 1 hour

const productCache = new Map<string, { data: any; expiresAt: number }>()
const PRODUCT_TTL_MS = 30 * 60 * 1000  // 30 min

// ── Normalizers ───────────────────────────────────────────────────────────────

function normalizeBrand(b: CRBrand) {
  const logoBase = b.logo_base_url ?? ''
  const raw = b as any
  const minNum = raw.min ? parseFloat(String(raw.min).replace(/[^0-9.]/g, '')) : 0
  const maxNum = raw.max ? parseFloat(String(raw.max).replace(/[^0-9.]/g, '')) : 0
  const range = minNum > 0 && maxNum > 0 ? { min: minNum, max: maxNum, step: 1 } : null
  return {
    id: b.family_name,
    name: b.brand_name,
    type: 'gift_card',
    categories: b.categories ?? [],
    denominations: [] as number[],
    range,
    country: '',
    countryCode: 'US',
    currency: 'USD',
    image: logoBase ? `${logoBase}.webp` : (b.logo_url ?? ''),
    imageKey: b.family_name,
  }
}

function normalizeProductOptions(options: CRProductOption[]): {
  denominations: number[]
  range: { min: number; max: number; step: number } | null
  coinAmounts: Record<number, number>   // faceValue → exact USDC
} {
  if (!options.length) return { denominations: [], range: null, coinAmounts: {} }

  const hasDynamic = options.some((o) => o.is_dynamic)

  if (hasDynamic) {
    const dynOptions = options.filter((o) => o.is_dynamic)
    const min = Math.min(...dynOptions.map((o) => Number(o.face_value?.amount?.min_price ?? 1)).filter(Boolean))
    const max = Math.max(...dynOptions.map((o) => Number(o.face_value?.amount?.max_price ?? 500)).filter(Boolean))
    const step = Number(dynOptions[0]?.face_value?.amount?.step ?? 1)
    return { denominations: [], range: { min: min || 1, max: max || 500, step: step || 1 }, coinAmounts: {} }
  }

  const seen = new Set<number>()
  const denominations: number[] = []
  const coinAmounts: Record<number, number> = {}

  for (const o of options) {
    const face = Number(o.face_value?.amount?.price ?? o.denomination.replace(/[^0-9.]/g, ''))
    if (!Number.isFinite(face) || face <= 0 || seen.has(face)) continue
    seen.add(face)
    denominations.push(face)
    const coin = Number(o.coin_amount)
    if (Number.isFinite(coin)) coinAmounts[face] = coin
  }

  denominations.sort((a, b) => a - b)
  return { denominations, range: null, coinAmounts }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /products — brand catalog (cached 1hr)
productsRouter.get('/', async (_req, res) => {
  try {
    const now = Date.now()
    if (!brandsCache || now > brandsCache.expiresAt) {
      const brands = await listBrands('US')
      brandsCache = { data: brands.map(normalizeBrand), expiresAt: now + BRANDS_TTL_MS }
    }
    res.json({ products: brandsCache.data })
  } catch (err) {
    console.error('[products] list failed:', err)
    res.status(502).json({ error: 'failed to fetch products' })
  }
})

// GET /products/:id — denomination details for a brand (cached 30min)
productsRouter.get('/:id', async (req, res) => {
  const familyName = req.params.id
  try {
    const now = Date.now()
    const cached = productCache.get(familyName)
    if (cached && now < cached.expiresAt) return res.json(cached.data)

    let brandName = familyName
    if (brandsCache) {
      const found = brandsCache.data.find((b: any) => b.id === familyName)
      if (found) brandName = found.name
    }

    const options = await getProductOptions(familyName, 'US')
    const { denominations, range, coinAmounts } = normalizeProductOptions(options)

    const result = { id: familyName, name: brandName, denominations, range, coinAmounts }
    productCache.set(familyName, { data: result, expiresAt: now + PRODUCT_TTL_MS })
    res.json(result)
  } catch (err) {
    console.error(`[products] detail failed for ${familyName}:`, err)
    res.status(502).json({ error: 'failed to fetch product details' })
  }
})
