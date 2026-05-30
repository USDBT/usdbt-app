import { Router } from 'express'
import { sql } from '../lib/db'
import { isAddress } from 'viem'
import { requireAuth } from '../middleware/auth'
import { ORDER_STATUS } from '../lib/order-status'

export const usersRouter = Router()

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

usersRouter.get('/:address/stats', requireAuth, async (req, res) => {
  const addr = req.params.address
  if (!isAddress(addr)) return res.status(400).json({ error: 'invalid address' })
  if ((req as any).walletAddress?.toLowerCase() !== addr.toLowerCase()) {
    return res.status(403).json({ error: 'forbidden' })
  }

  const orders = await sql`
    SELECT id, brand_name, face_value, coin_amount, status, created_at
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

  // Total spent (delivered) + top brands by spend
  let totalSpentUsdc = 0
  const brandSpend = new Map<string, number>()
  for (const o of orders) {
    if (!isCompleted(o.status)) continue
    const amt = Number(o.coin_amount) || 0
    totalSpentUsdc += amt
    brandSpend.set(o.brand_name, (brandSpend.get(o.brand_name) ?? 0) + amt)
  }
  const topBrands = Array.from(brandSpend.entries())
    .map(([label, value]) => ({ label, value: Number(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)

  res.json({
    totalOrders: orders.length,
    recentOrders: orders.slice(0, 6).map((o) => ({
      id: o.id,
      brandName: o.brand_name,
      faceValue: Number(o.face_value),
      coinAmount: Number(o.coin_amount) || 0,
      status: o.status,
      createdAt: o.created_at,
    })),
    ordersByDay: ordersByDay.map(({ label, count }) => ({ label, count })),
    statusMix,
    totalSpentUsdc: Number(totalSpentUsdc.toFixed(2)),
    topBrands,
  })
})

usersRouter.get('/:address', async (req, res) => {
  const addr = req.params.address
  if (!isAddress(addr)) return res.status(400).json({ error: 'invalid address' })

  const [user] = await sql`
    SELECT wallet_address, email FROM users WHERE lower(wallet_address) = lower(${addr})
  `
  if (!user) return res.status(404).json({ error: 'not found' })
  res.json({ walletAddress: user.wallet_address, email: user.email })
})

usersRouter.post('/', async (req, res) => {
  const { walletAddress, email } = req.body
  if (!walletAddress || !email) return res.status(400).json({ error: 'walletAddress and email are required' })
  if (!isAddress(walletAddress)) return res.status(400).json({ error: 'invalid walletAddress' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid email' })

  const [user] = await sql`
    INSERT INTO users (wallet_address, email)
    VALUES (${walletAddress}, ${email})
    ON CONFLICT (wallet_address) DO UPDATE SET email = EXCLUDED.email
    RETURNING wallet_address, email
  `
  res.status(201).json({ walletAddress: user.wallet_address, email: user.email })
})
