import { databases, requiredEnv } from '../lib/appwrite'
import { findIncomingTransfer, currentBlock } from '../lib/chain'
import { fulfillOrder } from './fulfillment'
import type { Address } from 'viem'

const DB = requiredEnv('APPWRITE_DATABASE_ID')
const COL = requiredEnv('APPWRITE_ORDERS_COLLECTION_ID')

const USDC_ADDRESS = (process.env.USDC_TOKEN_ADDRESS ?? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as Address
const PAYMENT_WALLET = requiredEnv('PAYMENT_WALLET_ADDRESS') as Address
const USDC_DECIMALS = 6
const LOOK_BACK_BLOCKS = 300n

export function startPoller(intervalMs = 15_000): void {
  console.log('[poller] started — checking every', intervalMs / 1000, 's')
  setInterval(checkPendingOrders, intervalMs)
}

async function checkPendingOrders(): Promise<void> {
  let docs: any[]
  try {
    // Fetch all docs with no query filter — Appwrite query syntax varies
    // by version/instance. Filter entirely in memory instead.
    const result = await databases.listDocuments(DB, COL)
    docs = result.documents ?? []
  } catch (err) {
    console.error('[poller] failed to fetch orders:', err)
    return
  }

  const now = new Date()
  const pending = docs.filter((d: any) => d.status === 'pending_payment')
  if (pending.length === 0) return

  const active  = pending.filter((d: any) => new Date(d.expiresAt) > now)
  const expired = pending.filter((d: any) => new Date(d.expiresAt) <= now)

  for (const doc of expired) {
    try {
      await databases.updateDocument(DB, COL, doc.$id, {
        status: 'failed',
        failureReason: 'payment window expired',
      })
      console.log(`[poller] expired order ${doc.$id}`)
    } catch (err) {
      console.error(`[poller] failed to expire order ${doc.$id}:`, err)
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
      console.error(`[poller] error checking order ${order.$id}:`, err)
    }
  }
}

async function checkOrder(order: any, fromBlock: bigint): Promise<void> {
  const match = await findIncomingTransfer({
    tokenAddress: USDC_ADDRESS,
    from: order.walletAddress as Address,
    to: PAYMENT_WALLET,
    expectedAmountHuman: order.paymentAmount,
    decimals: USDC_DECIMALS,
    fromBlock,
  })

  if (!match) return

  console.log(`[poller] payment detected for order ${order.$id} — tx ${match.txHash}`)

  await databases.updateDocument(DB, COL, order.$id, { txHash: match.txHash })
  await fulfillOrder(order.$id)
}
