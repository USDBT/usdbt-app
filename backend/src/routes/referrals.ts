import { Router } from 'express'
import { sql } from '../lib/db'
import { REFERRAL_DISCOUNT_SHARE, REFERRAL_POINTS_PER_USD, deriveReferralCode, resolveReferrer } from '../lib/rewards'

export const referralsRouter = Router()

referralsRouter.get('/:address', async (req, res) => {
  const addr = req.params.address?.toLowerCase()
  if (!addr) return res.status(400).json({ error: 'wallet address required' })

  const referralCode = deriveReferralCode(addr)

  // Referral earnings are points credited when a referred friend's order is delivered
  const referrals = await sql`
    SELECT t.id, t.points_delta, t.created_at, o.wallet_address AS referred_wallet
    FROM loyalty_transactions t
    JOIN orders o ON o.id = t.order_id
    WHERE t.wallet_address = ${addr} AND t.action = 'earn_referral'
    ORDER BY t.created_at DESC
  `
  const totalPoints = referrals.reduce((sum, r) => sum + Number(r.points_delta || 0), 0)

  res.json({
    walletAddress: addr,
    referralCode,
    referralLink: `https://usdbt.us/app?ref=${referralCode}`,
    totalReferred: new Set(referrals.map((r) => String(r.referred_wallet).toLowerCase())).size,
    totalRewardPoints: totalPoints,
    rewardPointsPerUsd: REFERRAL_POINTS_PER_USD,
    friendDiscountPct: REFERRAL_DISCOUNT_SHARE * 100,
    recentReferrals: referrals.slice(0, 10).map((r) => ({
      id: r.id,
      referredWallet: `${String(r.referred_wallet).slice(0, 6)}...${String(r.referred_wallet).slice(-4)}`,
      rewardPoints: Number(r.points_delta),
      createdAt: r.created_at,
    })),
  })
})

referralsRouter.get('/verify/:code', async (req, res) => {
  const code = req.params.code?.toUpperCase()
  if (!code || !(await resolveReferrer(code))) {
    return res.status(404).json({ valid: false, error: 'Invalid referral code' })
  }
  res.json({
    valid: true,
    code,
    discountPct: 2.0,
    description: '2% off your first order',
  })
})
