import { Router, type NextFunction, type Request, type Response } from 'express'
import { timingSafeEqual } from 'crypto'
import { isAddress } from 'viem'
import { sql } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import { EARN_POINTS_PER_USD, MAX_EARN_POINTS_PER_ORDER, MAX_EARN_POINTS_PER_WALLET_PER_DAY, REFERRAL_POINTS_PER_USD } from '../lib/rewards'
import { MIN_CONVERT_POINTS, USD_PER_POINT, getUsdbtPriceUsd, isUsdbtLaunched, pointsToUsdbt } from '../lib/usdbt'

export const rewardsRouter = Router()

const NOT_LAUNCHED = '$USDBT has not launched yet. Keep earning points; you can convert them to $USDBT at launch.'

// Program rules and launch state, for the Rewards and Referral pages.
rewardsRouter.get('/status', async (_req, res) => {
  const launched = isUsdbtLaunched()
  res.json({
    usdbtLaunched: launched,
    usdPerPoint: USD_PER_POINT,
    earnPointsPerUsd: EARN_POINTS_PER_USD,
    referralPointsPerUsd: REFERRAL_POINTS_PER_USD,
    maxPointsPerOrder: MAX_EARN_POINTS_PER_ORDER,
    maxPointsPerDay: MAX_EARN_POINTS_PER_WALLET_PER_DAY,
    minConvertPoints: MIN_CONVERT_POINTS,
    usdbtPriceUsd: launched ? await getUsdbtPriceUsd() : null,
  })
})

// Converts the caller's whole points balance into a $USDBT payout request (after launch only).
rewardsRouter.post('/convert', requireAuth, async (req, res) => {
  if (!isUsdbtLaunched()) return res.status(403).json({ error: NOT_LAUNCHED })
  const wallet = String((req as any).walletAddress ?? '').toLowerCase()
  if (!isAddress(wallet)) return res.status(401).json({ error: 'sign in with your wallet first' })

  const price = await getUsdbtPriceUsd()
  if (!price) return res.status(503).json({ error: 'The $USDBT price is unavailable right now. Try again shortly.' })

  const payout = await sql.begin(async (tx) => {
    const [row] = await tx`SELECT points_balance FROM user_loyalty WHERE wallet_address = ${wallet} FOR UPDATE`
    const points = Number(row?.points_balance ?? 0)
    if (points < MIN_CONVERT_POINTS) return null
    const { valueUsd, usdbt } = pointsToUsdbt(points, price)
    await tx`UPDATE user_loyalty SET points_balance = 0, updated_at = now() WHERE wallet_address = ${wallet}`
    const [created] = await tx`
      INSERT INTO usdbt_payouts (wallet_address, points, value_usd, price_usd, usdbt_amount)
      VALUES (${wallet}, ${points}, ${valueUsd}, ${price}, ${usdbt})
      RETURNING id, points, value_usd, usdbt_amount, status, requested_at
    `
    await tx`
      INSERT INTO loyalty_transactions (wallet_address, points_delta, action)
      VALUES (${wallet}, ${-points}, 'convert_usdbt')
    `
    return created
  })
  if (!payout) return res.status(400).json({ error: `You need at least ${MIN_CONVERT_POINTS} points to convert.` })
  res.status(201).json({ payout, message: 'Conversion requested. $USDBT payouts are sent in weekly batches.' })
})

rewardsRouter.get('/payouts/:address', requireAuth, async (req, res) => {
  const addr = String(req.params.address ?? '').toLowerCase()
  if (!isAddress(addr)) return res.status(400).json({ error: 'invalid address' })
  if (String((req as any).walletAddress ?? '').toLowerCase() !== addr) return res.status(403).json({ error: 'forbidden' })
  const payouts = await sql`
    SELECT id, points, value_usd, usdbt_amount, status, tx_hash, requested_at, resolved_at
    FROM usdbt_payouts WHERE wallet_address = ${addr} ORDER BY requested_at DESC LIMIT 20
  `
  res.json({ payouts })
})

// ----- Admin: review and settle payout batches. Disabled unless ADMIN_API_KEY is set. -----

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_API_KEY?.trim()
  if (!expected) return res.status(503).json({ error: 'admin API disabled' })
  const given = Buffer.from(String(req.headers['x-admin-key'] ?? ''))
  const want = Buffer.from(expected)
  if (given.length !== want.length || !timingSafeEqual(given, want)) return res.status(401).json({ error: 'unauthorized' })
  next()
}

rewardsRouter.get('/admin/payouts', requireAdmin, async (req, res) => {
  const status = String(req.query.status ?? 'requested')
  const payouts = await sql`
    SELECT * FROM usdbt_payouts WHERE status = ${status} ORDER BY requested_at ASC LIMIT 500
  `
  res.json({ payouts })
})

rewardsRouter.post('/admin/payouts/:id/paid', requireAdmin, async (req, res) => {
  const txHash = String(req.body?.txHash ?? '').trim()
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) return res.status(400).json({ error: 'txHash required' })
  const [payout] = await sql`
    UPDATE usdbt_payouts SET status = 'paid', tx_hash = ${txHash}, resolved_at = now()
    WHERE id = ${req.params.id} AND status = 'requested'
    RETURNING *
  `
  if (!payout) return res.status(404).json({ error: 'no requested payout with that id' })
  res.json({ payout })
})

// Rejecting a request returns the points to the wallet.
rewardsRouter.post('/admin/payouts/:id/reject', requireAdmin, async (req, res) => {
  const note = String(req.body?.reason ?? '').slice(0, 500) || null
  const payout = await sql.begin(async (tx) => {
    const [row] = await tx`
      UPDATE usdbt_payouts SET status = 'rejected', note = ${note}, resolved_at = now()
      WHERE id = ${req.params.id} AND status = 'requested'
      RETURNING *
    `
    if (!row) return null
    await tx`
      UPDATE user_loyalty SET points_balance = points_balance + ${row.points}, updated_at = now()
      WHERE wallet_address = ${row.wallet_address}
    `
    await tx`
      INSERT INTO loyalty_transactions (wallet_address, points_delta, action)
      VALUES (${row.wallet_address}, ${row.points}, 'convert_rejected')
    `
    return row
  })
  if (!payout) return res.status(404).json({ error: 'no requested payout with that id' })
  res.json({ payout })
})
