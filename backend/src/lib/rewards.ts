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
