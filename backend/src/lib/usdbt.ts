// $USDBT launch state and price. Until USDBT_LAUNCHED=true, rewards stay as points
// and nothing can be converted or paid out.

export const USD_PER_POINT = 0.01
export const MIN_CONVERT_POINTS = 500 // $5

export function isUsdbtLaunched(): boolean {
  return process.env.USDBT_LAUNCHED?.trim().toLowerCase() === 'true'
}

let cached: { price: number; at: number } | null = null
const CACHE_MS = 60_000

// USDBT_PRICE_USD pins a price (useful at launch). Otherwise the most liquid
// DexScreener pair for USDBT_TOKEN_ADDRESS is used. Null when no price is available.
export async function getUsdbtPriceUsd(): Promise<number | null> {
  const pinned = Number(process.env.USDBT_PRICE_USD)
  if (Number.isFinite(pinned) && pinned > 0) return pinned

  const token = process.env.USDBT_TOKEN_ADDRESS?.trim()
  if (!token) return null
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.price

  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = (await res.json()) as { pairs?: Array<{ priceUsd?: string; liquidity?: { usd?: number } }> }
    const best = (data.pairs ?? [])
      .filter((p) => Number(p.priceUsd) > 0)
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0]
    const price = Number(best?.priceUsd)
    if (!(price > 0)) return null
    cached = { price, at: Date.now() }
    return price
  } catch {
    return null
  }
}

export function pointsToUsdbt(points: number, priceUsd: number): { valueUsd: number; usdbt: number } {
  const valueUsd = Number((points * USD_PER_POINT).toFixed(2))
  return { valueUsd, usdbt: Number((valueUsd / priceUsd).toFixed(4)) }
}
