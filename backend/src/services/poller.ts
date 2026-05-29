import { sql, requiredEnv } from '../lib/db'
import { findIncomingTransfer, currentBlock } from '../lib/chain'
import { fulfillOrder } from './fulfillment'
import { ORDER_STATUS } from '../lib/order-status'
import type { Address } from 'viem'

const USDC_ADDRESS = (process.env.USDC_TOKEN_ADDRESS ?? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as Address
const PAYMENT_WALLET = requiredEnv('PAYMENT_WALLET_ADDRESS') as Address
const USDC_DECIMALS = 6
const LOOK_BACK_BLOCKS = 300n

export function startPoller(intervalMs = 15_000): void {
  console.log('[poller] started — checking every', intervalMs / 1000, 's')
  setInterval(checkPendingOrders, intervalMs)
}

async function checkPendingOrders(): Promise<void> {
  const now = new Date()

  const pending = await sql`
    SELECT id, wallet_address, payment_amount, expires_at
    FROM orders
    WHERE status = ${ORDER_STATUS.PENDING_PAYMENT}
  `
  if (pending.length === 0) return

  const active = pending.filter((d) => new Date(d.expires_at) > now)
  const expired = pending.filter((d) => new Date(d.expires_at) <= now)

  for (const order of expired) {
    try {
      await sql`
        UPDATE orders SET status = ${ORDER_STATUS.FAILED}, failure_reason = 'payment window expired'
        WHERE id = ${order.id}
      `
      console.log(`[poller] expired order ${order.id}`)
    } catch (err) {
      console.error(`[poller] failed to expire order ${order.id}:`, err)
    }
  }

  if (active.length === 0) return

  let latestBlock: bigint
  try {
    latestBlock = await currentBlock()
  } catch (err) {
    console.error('[poller] failed to get block number:', err)
    return
  }

  const fromBlock = latestBlock > LOOK_BACK_BLOCKS ? latestBlock - LOOK_BACK_BLOCKS : 0n

  for (const order of active) {
    try {
      await checkOrder(order, fromBlock)
    } catch (err) {
      console.error(`[poller] error checking order ${order.id}:`, err)
    }
  }
}

async function checkOrder(order: any, fromBlock: bigint): Promise<void> {
  const match = await findIncomingTransfer({
    tokenAddress: USDC_ADDRESS,
    from: order.wallet_address as Address,
    to: PAYMENT_WALLET,
    expectedAmountHuman: order.payment_amount,
    decimals: USDC_DECIMALS,
    fromBlock,
  })

  if (!match) return

  console.log(`[poller] payment detected for order ${order.id} — tx ${match.txHash}`)

  await sql`
    UPDATE orders SET tx_hash = ${match.txHash}, status = ${ORDER_STATUS.USER_DEBITED}
    WHERE id = ${order.id}
  `
  await fulfillOrder(order.id)
}
