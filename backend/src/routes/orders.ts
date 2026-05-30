import { Router } from 'express'
import { sql } from '../lib/db'
import { validateOrder, createCROrder, requiredEnv } from '../lib/cryptorefills'
import { ORDER_STATUS } from '../lib/order-status'
import { isAddress } from 'viem'

export const ordersRouter = Router()

const ORDER_TTL_MINUTES = 30

ordersRouter.post('/', async (req, res) => {
  const {
    brandName, familyName, countryCode = 'US',
    denomination, productValue,
    faceValue, email, walletAddress,
  } = req.body

  if (!brandName || !familyName || !denomination || !faceValue || !email || !walletAddress) {
    return res.status(400).json({ error: 'brandName, familyName, denomination, faceValue, email, and walletAddress are required' })
  }
  if (!isAddress(walletAddress)) {
    return res.status(400).json({ error: 'invalid walletAddress' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'invalid email' })
  }

  const userIp = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? '127.0.0.1'
  const userAgent = req.headers['user-agent'] ?? 'usdbt-backend/1.0'

  const crInput = { brandName, countryCode, denomination, productValue, email, userIp, userAgent }

  // Validate with CR before creating
  let validation: { ok: boolean; problems: any[] }
  try {
    validation = await validateOrder(crInput)
  } catch (err) {
    console.error('[orders] validation request failed:', err)
    return res.status(502).json({ error: 'could not validate order' })
  }
  if (!validation.ok) {
    const first = validation.problems[0]
    return res.status(422).json({ error: first.problem ?? 'order validation failed', problems: validation.problems })
  }

  // Create order with Cryptorefills
  let crOrder
  try {
    crOrder = await createCROrder(crInput)
  } catch (err) {
    console.error('[orders] CR order creation failed:', err)
    return res.status(502).json({ error: 'failed to create order with provider' })
  }

  const coinAmount = Number(crOrder.coin_amount)
  const expiresAt = crOrder.payment_requested_at
    ? new Date(crOrder.payment_requested_at * 1000 + ORDER_TTL_MINUTES * 60 * 1000)
    : new Date(Date.now() + ORDER_TTL_MINUTES * 60 * 1000)

  const [order] = await sql`
    INSERT INTO orders
      (wallet_address, email, card_type, brand_id, brand_name, face_value,
       payment_currency, payment_amount, fee_rate, status, expires_at,
       cr_order_id, payment_address, coin_amount)
    VALUES
      (${walletAddress}, ${email}, 'gift_card', ${familyName}, ${brandName}, ${faceValue},
       'USDC', ${coinAmount}, 0, ${ORDER_STATUS.PENDING_PAYMENT}, ${expiresAt},
       ${crOrder.order_id}, ${crOrder.wallet_address}, ${coinAmount})
    RETURNING id, expires_at, cr_order_id, payment_address, coin_amount
  `

  res.status(201).json({
    orderId: order.id,
    paymentAddress: order.payment_address,
    paymentAmount: Number(order.coin_amount),
    currency: 'USDC',
    expiresAt: order.expires_at,
    estimatedReadyAt: null,
  })
})

ordersRouter.get('/:id', async (req, res) => {
  const [order] = await sql`
    SELECT id, status, brand_name, face_value, coin_amount, payment_address,
           expires_at, failure_reason, cr_order_id
    FROM orders WHERE id = ${req.params.id}
  `
  if (!order) return res.status(404).json({ error: 'order not found' })

  res.json({
    orderId: order.id,
    status: order.status,
    brandName: order.brand_name,
    faceValue: order.face_value,
    paymentAmount: Number(order.coin_amount ?? 0),
    currency: 'USDC',
    paymentAddress: order.payment_address,
    txHash: null,
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

function getOrderProgress(status: string) {
  const MAP: Record<string, { step: number; totalSteps: number; label: string; terminal: boolean }> = {
    [ORDER_STATUS.PENDING_PAYMENT]:      { step: 1, totalSteps: 4, label: 'Waiting for payment',         terminal: false },
    [ORDER_STATUS.USER_DEBITED]:         { step: 2, totalSteps: 4, label: 'Payment received',             terminal: false },
    [ORDER_STATUS.HOT_WALLET_FUNDED]:    { step: 3, totalSteps: 4, label: 'Processing with provider',    terminal: false },
    [ORDER_STATUS.BITREFILL_PROCESSING]: { step: 3, totalSteps: 4, label: 'Issuing your card',           terminal: false },
    [ORDER_STATUS.DELIVERED]:            { step: 4, totalSteps: 4, label: 'Card delivered to your email', terminal: true  },
    [ORDER_STATUS.FAILED]:               { step: 4, totalSteps: 4, label: 'Order failed',                terminal: true  },
    [ORDER_STATUS.REFUNDED]:             { step: 4, totalSteps: 4, label: 'Order refunded',              terminal: true  },
  }
  return MAP[status] ?? { step: 1, totalSteps: 4, label: status, terminal: false }
}
