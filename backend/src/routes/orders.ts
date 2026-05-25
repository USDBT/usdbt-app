import { Router } from 'express'
import { ID } from 'node-appwrite'
import { databases } from '../lib/appwrite'
import { getProduct } from '../lib/bitrefill'
import { isAddress } from 'viem'

export const ordersRouter = Router()

const DB = process.env.APPWRITE_DATABASE_ID!
const COL = process.env.APPWRITE_ORDERS_COLLECTION_ID!
const PAYMENT_ADDRESS = process.env.PAYMENT_WALLET_ADDRESS!
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

  const expiresAt = new Date(Date.now() + ORDER_TTL_MINUTES * 60 * 1000).toISOString()

  const doc = await databases.createDocument(DB, COL, ID.unique(), {
    walletAddress,
    email,
    cardType: 'gift_card',
    brandId: product.id,
    brandName: product.name,
    faceValue: value,
    paymentCurrency: currency,
    paymentAmount,
    feeRate,
    status: 'pending_payment',
    expiresAt,
  })

  res.status(201).json({
    orderId: doc.$id,
    paymentAddress: PAYMENT_ADDRESS,
    paymentAmount,
    currency,
    expiresAt,
  })
})

ordersRouter.get('/:id', async (req, res) => {
  try {
    const doc = await databases.getDocument(DB, COL, req.params.id)
    res.json({
      orderId: doc.$id,
      status: (doc as any).status,
      brandName: (doc as any).brandName,
      faceValue: (doc as any).faceValue,
      paymentAmount: (doc as any).paymentAmount,
      currency: (doc as any).paymentCurrency,
      txHash: (doc as any).txHash ?? null,
      expiresAt: (doc as any).expiresAt,
    })
  } catch {
    res.status(404).json({ error: 'order not found' })
  }
})
