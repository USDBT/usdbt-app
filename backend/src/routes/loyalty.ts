import { Router } from 'express'
import { sql } from '../lib/db'
import { isUsdbtLaunched } from '../lib/usdbt'

export const loyaltyRouter = Router()

export function calculateTier(lifetimePoints: number): {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  multiplier: number
  perkDiscountPct: number
  nextThreshold: number
} {
  if (lifetimePoints >= 20000) {
    return { tier: 'platinum', multiplier: 2.0, perkDiscountPct: 5, nextThreshold: 20000 }
  }
  if (lifetimePoints >= 5000) {
    return { tier: 'gold', multiplier: 1.5, perkDiscountPct: 3, nextThreshold: 20000 }
  }
  if (lifetimePoints >= 1000) {
    return { tier: 'silver', multiplier: 1.2, perkDiscountPct: 2, nextThreshold: 5000 }
  }
  return { tier: 'bronze', multiplier: 1.0, perkDiscountPct: 0, nextThreshold: 1000 }
}

loyaltyRouter.get('/:address', async (req, res) => {
  const addr = req.params.address?.toLowerCase()
  if (!addr) return res.status(400).json({ error: 'wallet address required' })

  // Read-only: points are only created by delivered orders (no free sign-up points to farm)
  const [row] = await sql`
    SELECT wallet_address, points_balance, lifetime_points, tier, updated_at
    FROM user_loyalty
    WHERE lower(wallet_address) = ${addr}
  `
  const loyalty = row ?? { wallet_address: addr, points_balance: 0, lifetime_points: 0, tier: 'bronze' }

  const tierInfo = calculateTier(loyalty.lifetime_points)

  const transactions = await sql`
    SELECT id, order_id, points_delta, action, created_at
    FROM loyalty_transactions
    WHERE lower(wallet_address) = ${addr}
    ORDER BY created_at DESC
    LIMIT 10
  `

  res.json({
    walletAddress: loyalty.wallet_address,
    pointsBalance: loyalty.points_balance,
    lifetimePoints: loyalty.lifetime_points,
    tier: tierInfo.tier,
    multiplier: tierInfo.multiplier,
    perkDiscountPct: tierInfo.perkDiscountPct,
    nextTierThreshold: tierInfo.nextThreshold,
    pointsToNextTier: Math.max(0, tierInfo.nextThreshold - loyalty.lifetime_points),
    transactions,
    usdbtLaunched: isUsdbtLaunched(),
  })
})

loyaltyRouter.post('/calculate-discount', async (req, res) => {
  const { walletAddress, faceValue, points } = req.body
  if (!walletAddress || !faceValue) {
    return res.status(400).json({ error: 'walletAddress and faceValue are required' })
  }

  const addr = walletAddress.toLowerCase()
  const [loyalty] = await sql`
    SELECT points_balance FROM user_loyalty WHERE lower(wallet_address) = ${addr}
  `
  const availablePoints = loyalty?.points_balance ?? 0
  const requestedPoints = Math.min(Number(points) || 0, availablePoints)

  // 100 points = $1.00 discount, max 20% of card face value
  const maxDiscountAllowed = faceValue * 0.20
  const potentialDiscount = requestedPoints / 100
  const actualDiscount = Math.min(potentialDiscount, maxDiscountAllowed)
  const actualPointsUsed = Math.floor(actualDiscount * 100)

  res.json({
    availablePoints,
    pointsUsed: actualPointsUsed,
    discountAmount: parseFloat(actualDiscount.toFixed(2)),
    remainingPrice: parseFloat((faceValue - actualDiscount).toFixed(2)),
  })
})
