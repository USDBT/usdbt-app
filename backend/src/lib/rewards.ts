import type postgres from 'postgres'
import { sql } from './db'
import { ORDER_STATUS } from './order-status'

export const POINTS_PER_USD = 100
export const MAX_LOYALTY_DISCOUNT_SHARE = 0.2
export const REFERRAL_DISCOUNT_SHARE = 0.02

export class PointsUnavailableError extends Error {}

// A referral code is REF- plus the first 6 hex characters of the referrer's wallet.
export function deriveReferralCode(walletAddress: string): string {
  return `REF-${walletAddress.toLowerCase().replace(/^0x/, '').slice(0, 6).toUpperCase()}`
}

// The referrer's wallet, or null unless the code maps to exactly one registered user
// who is not the buyer. Codes are only 6 hex chars, so an ambiguous prefix is rejected.
export async function resolveReferrer(code: unknown, buyerWallet?: string): Promise<string | null> {
  const match = /^REF-([0-9A-F]{6})$/i.exec(String(code ?? '').trim())
  if (!match) return null
  const rows = await sql`
    SELECT lower(wallet_address) AS wallet FROM users
    WHERE lower(wallet_address) LIKE ${'0x' + match[1].toLowerCase() + '%'}
    LIMIT 2
  `
  if (rows.length !== 1) return null
  const referrer = String(rows[0].wallet)
  return buyerWallet && referrer === buyerWallet.toLowerCase() ? null : referrer
}

// The referral discount is for a buyer's first order only.
export async function isFirstOrder(walletAddress: string): Promise<boolean> {
  const [row] = await sql`
    SELECT count(*)::int AS n FROM orders
    WHERE lower(wallet_address) = ${walletAddress.toLowerCase()} AND status = ${ORDER_STATUS.DELIVERED}
  `
  return Number(row?.n ?? 0) === 0
}

export async function getPointsBalance(walletAddress: string): Promise<number> {
  const [row] = await sql`
    SELECT points_balance FROM user_loyalty WHERE wallet_address = ${walletAddress.toLowerCase()}
  `
  return Number(row?.points_balance ?? 0)
}

// Runs the order INSERT and, when points are redeemed, deducts them in the same
// transaction. Throws PointsUnavailableError if the balance no longer covers them.
export async function insertOrderRedeemingPoints(
  walletAddress: string,
  points: number,
  insert: (tx: postgres.TransactionSql) => Promise<postgres.RowList<postgres.Row[]>>,
): Promise<postgres.Row[]> {
  const wallet = walletAddress.toLowerCase()
  return sql.begin(async (tx) => {
    if (points <= 0) return [...(await insert(tx))]
    const [left] = await tx`
      UPDATE user_loyalty SET points_balance = points_balance - ${points}, updated_at = now()
      WHERE wallet_address = ${wallet} AND points_balance >= ${points}
      RETURNING points_balance
    `
    if (!left) throw new PointsUnavailableError()
    const rows = await insert(tx)
    await tx`
      INSERT INTO loyalty_transactions (wallet_address, order_id, points_delta, action)
      VALUES (${wallet}, ${rows[0].id}, ${-points}, 'redeem_order')
    `
    return [...rows]
  }) as Promise<postgres.Row[]>
}

// Gives back points redeemed on an order that failed, expired or was refunded. Safe to call twice.
export async function refundRedeemedPoints(orderId: string): Promise<void> {
  await sql.begin(async (tx) => {
    const [order] = await tx`
      SELECT lower(wallet_address) AS wallet, loyalty_points_used AS points FROM orders WHERE id = ${orderId}
    `
    const points = Number(order?.points ?? 0)
    if (!order || points <= 0) return
    const [redeemed] = await tx`
      SELECT 1 FROM loyalty_transactions WHERE order_id = ${orderId} AND action = 'redeem_order'
    `
    const [refunded] = await tx`
      SELECT 1 FROM loyalty_transactions WHERE order_id = ${orderId} AND action = 'refund_order'
    `
    if (!redeemed || refunded) return
    await tx`
      UPDATE user_loyalty SET points_balance = points_balance + ${points}, updated_at = now()
      WHERE wallet_address = ${order.wallet}
    `
    await tx`
      INSERT INTO loyalty_transactions (wallet_address, order_id, points_delta, action)
      VALUES (${order.wallet}, ${orderId}, ${points}, 'refund_order')
    `
  })
}

// ---------------------------------------------------------------------------
// Earning. Until $USDBT launches, rewards are paid as points (1 point = $0.01,
// the same value points have at checkout). After launch, points convert to $USDBT.
// ---------------------------------------------------------------------------

export const EARN_POINTS_PER_USD = 1 // 1% back on the amount actually paid
export const REFERRAL_POINTS_PER_USD = 1 // referrer gets 1% of what their friend pays
export const MAX_EARN_POINTS_PER_ORDER = 500 // $5
export const MAX_EARN_POINTS_PER_WALLET_PER_DAY = 2000 // $20
const MONTHLY_BUDGET_POINTS = Number(process.env.REWARDS_MONTHLY_BUDGET_POINTS ?? 100_000) // $1,000

export const TIER_EARN_MULTIPLIER = { bronze: 1, silver: 1.2, gold: 1.5, platinum: 2 } as const

export function tierForLifetimePoints(lifetimePoints: number): keyof typeof TIER_EARN_MULTIPLIER {
  if (lifetimePoints >= 20000) return 'platinum'
  if (lifetimePoints >= 5000) return 'gold'
  if (lifetimePoints >= 1000) return 'silver'
  return 'bronze'
}

// Points for one reward, after the per-order cap, the wallet's remaining daily
// allowance and the program's remaining monthly budget.
export function earnPointsFor(opts: {
  paidUsd: number
  pointsPerUsd: number
  multiplier?: number
  earnedTodayByWallet: number
  earnedThisMonthByProgram: number
  monthlyBudget?: number
}): number {
  const raw = Math.floor(Math.max(0, opts.paidUsd) * opts.pointsPerUsd * (opts.multiplier ?? 1))
  const dailyLeft = MAX_EARN_POINTS_PER_WALLET_PER_DAY - opts.earnedTodayByWallet
  const budgetLeft = (opts.monthlyBudget ?? MONTHLY_BUDGET_POINTS) - opts.earnedThisMonthByProgram
  return Math.max(0, Math.min(raw, MAX_EARN_POINTS_PER_ORDER, dailyLeft, budgetLeft))
}

const EARN_ACTIONS = ['earn_order', 'earn_referral']

async function addPoints(tx: postgres.TransactionSql, wallet: string, orderId: string, points: number, action: string) {
  // The unique (order, wallet, action) index makes a repeat credit insert nothing.
  const inserted = await tx`
    INSERT INTO loyalty_transactions (wallet_address, order_id, points_delta, action)
    VALUES (${wallet}, ${orderId}, ${points}, ${action})
    ON CONFLICT DO NOTHING
    RETURNING id
  `
  if (inserted.length === 0) return
  await tx`
    INSERT INTO user_loyalty (wallet_address, points_balance, lifetime_points, tier)
    VALUES (${wallet}, ${points}, ${points}, ${tierForLifetimePoints(points)})
    ON CONFLICT (wallet_address) DO UPDATE
    SET points_balance = user_loyalty.points_balance + ${points},
        lifetime_points = user_loyalty.lifetime_points + ${points},
        updated_at = now()
  `
  await tx`
    UPDATE user_loyalty
    SET tier = CASE
      WHEN lifetime_points >= 20000 THEN 'platinum'
      WHEN lifetime_points >= 5000 THEN 'gold'
      WHEN lifetime_points >= 1000 THEN 'silver'
      ELSE 'bronze' END
    WHERE wallet_address = ${wallet}
  `
}

async function earnedToday(tx: postgres.TransactionSql, wallet: string): Promise<number> {
  const [row] = await tx`
    SELECT coalesce(sum(points_delta), 0)::int AS n FROM loyalty_transactions
    WHERE wallet_address = ${wallet} AND action = ANY(${EARN_ACTIONS})
      AND created_at >= date_trunc('day', now())
  `
  return Number(row?.n ?? 0)
}

// Credits purchase points to the buyer and referral points to the referrer once an
// order is delivered. Safe to call more than once for the same order.
export async function creditOrderRewards(orderId: string): Promise<void> {
  await sql.begin(async (tx) => {
    const [order] = await tx`
      SELECT lower(wallet_address) AS wallet, coin_amount, status, lower(referrer_wallet) AS referrer
      FROM orders WHERE id = ${orderId}
    `
    if (!order || order.status !== ORDER_STATUS.DELIVERED) return
    // Rewards are based on what the provider actually charged (USDC), not the requested face value
    const paidUsd = Number(order.coin_amount) || 0

    // Serialize budget checks so concurrent deliveries cannot overspend the month.
    await tx`SELECT pg_advisory_xact_lock(hashtext('usdbt_rewards_budget'))`
    const [month] = await tx`
      SELECT coalesce(sum(points_delta), 0)::int AS n FROM loyalty_transactions
      WHERE action = ANY(${EARN_ACTIONS}) AND created_at >= date_trunc('month', now())
    `
    let programMonth = Number(month?.n ?? 0)

    const [buyer] = await tx`SELECT lifetime_points FROM user_loyalty WHERE wallet_address = ${order.wallet}`
    const buyerPoints = earnPointsFor({
      paidUsd,
      pointsPerUsd: EARN_POINTS_PER_USD,
      multiplier: TIER_EARN_MULTIPLIER[tierForLifetimePoints(Number(buyer?.lifetime_points ?? 0))],
      earnedTodayByWallet: await earnedToday(tx, order.wallet),
      earnedThisMonthByProgram: programMonth,
    })
    if (buyerPoints > 0) {
      await addPoints(tx, order.wallet, orderId, buyerPoints, 'earn_order')
      programMonth += buyerPoints
    }

    if (order.referrer && order.referrer !== order.wallet) {
      const referrerPoints = earnPointsFor({
        paidUsd,
        pointsPerUsd: REFERRAL_POINTS_PER_USD,
        earnedTodayByWallet: await earnedToday(tx, order.referrer),
        earnedThisMonthByProgram: programMonth,
      })
      if (referrerPoints > 0) await addPoints(tx, order.referrer, orderId, referrerPoints, 'earn_referral')
    }
  })
}

// Takes back points earned on an order that was refunded after delivery.
export async function reverseOrderRewards(orderId: string): Promise<void> {
  await sql.begin(async (tx) => {
    const earned = await tx`
      SELECT wallet_address, points_delta, action FROM loyalty_transactions
      WHERE order_id = ${orderId} AND action = ANY(${EARN_ACTIONS})
    `
    for (const row of earned) {
      const reversal = 'reverse_' + row.action
      const inserted = await tx`
        INSERT INTO loyalty_transactions (wallet_address, order_id, points_delta, action)
        VALUES (${row.wallet_address}, ${orderId}, ${-Number(row.points_delta)}, ${reversal})
        ON CONFLICT DO NOTHING
        RETURNING id
      `
      if (inserted.length === 0) continue
      await tx`
        UPDATE user_loyalty SET points_balance = GREATEST(0, points_balance - ${Number(row.points_delta)}), updated_at = now()
        WHERE wallet_address = ${row.wallet_address}
      `
    }
  })
}
