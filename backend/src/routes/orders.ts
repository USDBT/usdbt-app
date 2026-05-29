import { Router } from 'express'
import { sql, requiredEnv } from '../lib/db'
import { getProduct } from '../lib/bitrefill'
import { ORDER_STATUS } from '../lib/order-status'
import { getOrderProgress } from '../lib/order-progress'
import { isAddress } from 'viem'

export const ordersRouter = Router()

const PAYMENT_ADDRESS = requiredEnv('PAYMENT_WALLET_ADDRESS')
const ORDER_TTL_MINUTES = 30

ordersRouter.post('/', async (req, res) => {
  const { productId, value, email, walletAddress, currency = 'USDC' } = req.body

  if (!productId || !value || !email || !walletAddress) {
    return res.status(400).json({ error: 'productId, value, email, and walletAddress are required' })
  }
  if (!isAddress(walletAddress)) {
    return res.status(400).json({ error: 'invalid walletAddress' })
  }
  if (!['USDC', 'USDBT'].includes(currency)) {
    return res.status(400).json({ error: 'currency must be USDC or USDBT' })
  }

  let product
  try {
    product = await getProduct(productId)
  } catch {
    return res.status(404).json({ error: 'product not found' })
  }

  const feeRate = currency === 'USDBT' ? 0.02 : 0.04
  const paymentAmount = parseFloat((value * (1 + feeRate)).toFixed(6))
  const expiresAt = new Date(Date.now() + ORDER_TTL_MINUTES * 60 * 1000)

  const [order] = await sql`
    INSERT INTO orders
      (wallet_address, email, card_type, brand_id, brand_name, face_value,
       payment_currency, payment_amount, fee_rate, status, expires_at)
    VALUES
      (${walletAddress}, ${email}, 'gift_card', ${product.id}, ${product.name}, ${value},
       ${currency}, ${paymentAmount}, ${feeRate}, ${ORDER_STATUS.PENDING_PAYMENT}, ${expiresAt})
    RETURNING id, expires_at
  `

  res.status(201).json({
    orderId: order.id,
    paymentAddress: PAYMENT_ADDRESS,
    paymentAmount,
    currency,
    expiresAt: order.expires_at,
    estimatedReadyAt: null,
  })
})

ordersRouter.get('/:id', async (req, res) => {
  const [order] = await sql`
    SELECT id, status, brand_name, face_value, payment_amount, payment_currency,
           tx_hash, expires_at, failure_reason
    FROM orders
    WHERE id = ${req.params.id}
  `
  if (!order) return res.status(404).json({ error: 'order not found' })

  res.json({
    orderId: order.id,
    status: order.status,
    brandName: order.brand_name,
    faceValue: order.face_value,
    paymentAmount: order.payment_amount,
    currency: order.payment_currency,
    txHash: order.tx_hash ?? null,
    expiresAt: order.expires_at,
    estimatedReadyAt: null,
    deliveredAt: null,
    failureReason: order.failure_reason ?? null,
    progress: getOrderProgress(order.status),
  })
})

ordersRouter.get('/:id/progress', async (req, res) => {
  const [order] = await sql`
    SELECT id, status, failure_reason FROM orders WHERE id = ${req.params.id}
  `
  if (!order) return res.status(404).json({ error: 'order not found' })

  res.json({
    orderId: order.id,
    status: order.status,
    progress: getOrderProgress(order.status),
    estimatedReadyAt: null,
    failureReason: order.failure_reason ?? null,
  })
})
