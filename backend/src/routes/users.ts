import { Router } from 'express'
import { sql } from '../lib/db'
import { isAddress } from 'viem'
import { requireAuth } from '../middleware/auth'
import { ORDER_STATUS } from '../lib/order-status'

export const usersRouter = Router()

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

usersRouter.get('/:address/stats', requireAuth, async (req, res) => {
  const addr = req.params.address
  if (!isAddress(addr) && !addr.startsWith('USDBT')) return res.status(400).json({ error: 'invalid address' })
  if ((req as any).walletAddress?.toLowerCase() !== addr.toLowerCase()) {
    return res.status(403).json({ error: 'forbidden' })
  }

  const orders = await sql`
    SELECT id, brand_name, face_value, coin_amount, status, created_at,
           payment_chain, payment_currency, quantity, volume_discount_pct,
           loyalty_discount_amount, referral_discount_amount, is_nft, is_escrow
    FROM orders
    WHERE lower(wallet_address) = lower(${addr})
    ORDER BY created_at DESC
  `

  const isCompleted = (s: string) => s === ORDER_STATUS.DELIVERED
  const isFailed = (s: string) => s === ORDER_STATUS.FAILED || s === ORDER_STATUS.REFUNDED

  // Status mix
  const statusMix = { completed: 0, pending: 0, failed: 0 }
  for (const o of orders) {
    if (isCompleted(o.status)) statusMix.completed++
    else if (isFailed(o.status)) statusMix.failed++
    else statusMix.pending++
  }

  // Orders per day for the last 7 days (oldest → newest)
  const now = new Date()
  const ordersByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return { label: DAY_LABELS[d.getDay()], date: d, count: 0 }
  })
  for (const o of orders) {
    const created = new Date(o.created_at)
    for (const bucket of ordersByDay) {
      const next = new Date(bucket.date); next.setDate(bucket.date.getDate() + 1)
      if (created >= bucket.date && created < next) { bucket.count++; break }
    }
  }

  // Spend & Savings metrics
  let totalSpentUsdc = 0
  let totalSavedUsd = 0
  const brandSpend = new Map<string, number>()
  const chainSpend: Record<string, number> = { robinhood: 0, base: 0, ethereum: 0, solana: 0 }
  const currencySpend: Record<string, number> = { USDG: 0, ETH: 0, USDC: 0, SOL: 0, USDT: 0 }

  for (const o of orders) {
    const amt = Number(o.face_value || o.coin_amount) || 0
    if (isCompleted(o.status)) {
      totalSpentUsdc += amt
      brandSpend.set(o.brand_name, (brandSpend.get(o.brand_name) ?? 0) + amt)

      const chain = (o.payment_chain || 'robinhood').toLowerCase()
      chainSpend[chain] = (chainSpend[chain] ?? 0) + amt

      const curr = (o.payment_currency || 'USDG').toUpperCase()
      currencySpend[curr] = (currencySpend[curr] ?? 0) + (Number(o.coin_amount) || amt)
    }

    const volDiscount = ((Number(o.face_value) * Number(o.volume_discount_pct || 0)) / 100) || 0
    const loyaltyDiscount = Number(o.loyalty_discount_amount || 0)
    const refDiscount = Number(o.referral_discount_amount || 0)
    totalSavedUsd += (volDiscount + loyaltyDiscount + refDiscount)
  }

  const topBrands = Array.from(brandSpend.entries())
    .map(([label, value]) => ({ label, value: Number(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  res.json({
    totalOrders: orders.length,
    recentOrders: orders.slice(0, 10).map((o) => ({
      id: o.id,
      brandName: o.brand_name,
      faceValue: Number(o.face_value),
      coinAmount: Number(o.coin_amount) || 0,
      paymentCurrency: o.payment_currency || 'USDG',
      paymentChain: o.payment_chain || 'robinhood',
      status: o.status,
      quantity: o.quantity || 1,
      isNft: o.is_nft || false,
      isEscrow: o.is_escrow || false,
      createdAt: o.created_at,
    })),
    ordersByDay: ordersByDay.map(({ label, count }) => ({ label, count })),
    statusMix,
    totalSpentUsdc: Number(totalSpentUsdc.toFixed(2)),
    totalSavedUsd: Number(totalSavedUsd.toFixed(2)),
    topBrands,
    spendByChain: chainSpend,
    spendByCurrency: currencySpend,
  })
})

usersRouter.get('/:address', async (req, res) => {
  const addr = req.params.address
  if (!isAddress(addr) && !addr.startsWith('USDBT')) return res.status(400).json({ error: 'invalid address' })

  const [user] = await sql`
    SELECT wallet_address, email FROM users WHERE lower(wallet_address) = lower(${addr})
  `
  if (!user) return res.status(404).json({ error: 'not found' })
  res.json({ walletAddress: user.wallet_address, email: user.email })
})

usersRouter.post('/', async (req, res) => {
  const { walletAddress, email } = req.body
  if (!walletAddress || !email) return res.status(400).json({ error: 'walletAddress and email are required' })
  if (!isAddress(walletAddress) && !walletAddress.startsWith('USDBT')) return res.status(400).json({ error: 'invalid walletAddress' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid email' })

  const [user] = await sql`
    INSERT INTO users (wallet_address, email)
    VALUES (${walletAddress}, ${email})
    ON CONFLICT (wallet_address) DO UPDATE SET email = EXCLUDED.email
    RETURNING wallet_address, email
  `
  res.status(201).json({ walletAddress: user.wallet_address, email: user.email })
})
