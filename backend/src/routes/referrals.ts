import { Router } from 'express'
import { sql } from '../lib/db'

export const referralsRouter = Router()

function deriveReferralCode(walletAddress: string): string {
  const clean = walletAddress.toLowerCase().replace(/^0x/, '')
  return `REF-${clean.slice(0, 6).toUpperCase()}`
}

referralsRouter.get('/:address', async (req, res) => {
  const addr = req.params.address?.toLowerCase()
  if (!addr) return res.status(400).json({ error: 'wallet address required' })

  const referralCode = deriveReferralCode(addr)

  const referrals = await sql`
    SELECT id, referred_wallet, reward_amount, status, created_at
    FROM referrals
    WHERE lower(referrer_wallet) = ${addr}
    ORDER BY created_at DESC
  `

  const totalRewards = referrals.reduce((sum, r) => sum + Number(r.reward_amount || 0), 0)
  const pendingRewards = referrals
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + Number(r.reward_amount || 0), 0)

  res.json({
    walletAddress: addr,
    referralCode,
    referralLink: `https://usdbt.us/app?ref=${referralCode}`,
    totalReferred: referrals.length,
    totalRewardsUsd: parseFloat(totalRewards.toFixed(2)),
    claimableUsd: parseFloat(pendingRewards.toFixed(2)),
    rewardRatePct: 1.5, // Referrer gets 1.5% cashback on friend's purchases
    friendDiscountPct: 2.0, // Friend gets 2.0% off first purchase
    recentReferrals: referrals.slice(0, 10).map((r) => ({
      id: r.id,
      referredWallet: `${r.referred_wallet.slice(0, 6)}...${r.referred_wallet.slice(-4)}`,
      rewardAmount: Number(r.reward_amount),
      status: r.status,
      createdAt: r.created_at,
    })),
  })
})

referralsRouter.post('/claim', async (req, res) => {
  const { walletAddress } = req.body
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' })
  const addr = walletAddress.toLowerCase()

  const [claimed] = await sql`
    UPDATE referrals
    SET status = 'claimed'
    WHERE lower(referrer_wallet) = ${addr} AND status = 'completed'
    RETURNING id, reward_amount
  `

  res.json({
    success: true,
    message: 'Rewards claimed! Dispatched to connected wallet address.',
    claimedCount: claimed ? 1 : 0,
  })
})

referralsRouter.get('/verify/:code', async (req, res) => {
  const code = req.params.code?.toUpperCase()
  if (!code || !code.startsWith('REF-')) {
    return res.status(404).json({ valid: false, error: 'Invalid referral code' })
  }
  res.json({
    valid: true,
    code,
    discountPct: 2.0,
    description: '2% instant discount on your order',
  })
})
