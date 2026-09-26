import { Router } from 'express'
import { sql } from '../lib/db'
import { randomBytes } from 'crypto'
import { listBrands } from '../lib/cryptorefills'

export const merchantRouter = Router()

// Middleware to authenticate merchant by API key
async function requireMerchant(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey
  if (!apiKey) {
    return res.status(401).json({ error: 'x-api-key header is required' })
  }
  const [merchant] = await sql`
    SELECT id, wallet_address, merchant_name, api_key, webhook_url, status, total_volume
    FROM merchants
    WHERE api_key = ${String(apiKey)}
  `
  if (!merchant || merchant.status !== 'active') {
    return res.status(403).json({ error: 'invalid or suspended API key' })
  }
  req.merchant = merchant
  next()
}

// 1. Merchant Registration & API key generation
merchantRouter.post('/register', async (req, res) => {
  const { walletAddress, merchantName, webhookUrl } = req.body
  if (!walletAddress || !merchantName) {
    return res.status(400).json({ error: 'walletAddress and merchantName are required' })
  }

  const generatedKey = `sk_live_${randomBytes(20).toString('hex')}`

  const [merchant] = await sql`
    INSERT INTO merchants (wallet_address, merchant_name, api_key, webhook_url, status, total_volume)
    VALUES (${walletAddress}, ${merchantName}, ${generatedKey}, ${webhookUrl || null}, 'active', 0)
    RETURNING id, wallet_address, merchant_name, api_key, webhook_url, status, created_at
  `

  res.status(201).json({
    message: 'Merchant account created successfully',
    merchant: {
      id: merchant.id,
      name: merchant.merchant_name,
      walletAddress: merchant.wallet_address,
      apiKey: merchant.api_key,
      webhookUrl: merchant.webhook_url,
      status: merchant.status,
      createdAt: merchant.created_at,
    },
  })
})

// 2. Fetch Merchant Profile & Keys
merchantRouter.get('/me', requireMerchant, async (req: any, res) => {
  const m = req.merchant
  const orders = await sql`
    SELECT id, external_ref, product_id, brand_name, face_value, recipient_email, status, card_code, created_at
    FROM merchant_orders
    WHERE merchant_id = ${m.id}
    ORDER BY created_at DESC
    LIMIT 20
  `

  res.json({
    merchant: {
      id: m.id,
      name: m.merchant_name,
      walletAddress: m.wallet_address,
      apiKey: m.api_key,
      webhookUrl: m.webhook_url,
      totalVolume: Number(m.total_volume || 0),
    },
    orders,
  })
})

// 3. Wholesale Products Catalog for Merchants
merchantRouter.get('/products', requireMerchant, async (_req, res) => {
  try {
    const brands = await listBrands()
    // Provide wholesale merchant discount rate of 2.5% off face value
    const wholesaleProducts = brands.slice(0, 50).map((b) => ({
      productId: b.id,
      name: b.name,
      country: b.country || 'US',
      denominations: b.denominations,
      wholesaleDiscount: '2.5%',
      settlementCurrencies: ['USDC', 'USDG', 'ETH', 'SOL'],
    }))
    res.json({ count: wholesaleProducts.length, products: wholesaleProducts })
  } catch {
    res.json({
      count: 5,
      products: [
        { productId: 'amazon', name: 'Amazon', wholesaleDiscount: '2.5%', denominations: [10, 25, 50, 100, 250] },
        { productId: 'apple', name: 'Apple Gift Card', wholesaleDiscount: '2.5%', denominations: [15, 25, 50, 100] },
        { productId: 'uber', name: 'Uber & Uber Eats', wholesaleDiscount: '2.5%', denominations: [25, 50, 100] },
        { productId: 'steam', name: 'Steam Wallet', wholesaleDiscount: '2.5%', denominations: [20, 50, 100] },
        { productId: 'airbnb', name: 'Airbnb', wholesaleDiscount: '2.5%', denominations: [50, 100, 250, 500] },
      ],
    })
  }
})

// 4. Programmatic Order Creation for Merchants
merchantRouter.post('/orders', requireMerchant, async (req: any, res) => {
  const m = req.merchant
  const { productId, brandName, faceValue, recipientEmail, externalRef } = req.body

  if (!productId || !brandName || !faceValue || !recipientEmail) {
    return res.status(400).json({ error: 'productId, brandName, faceValue, and recipientEmail are required' })
  }

  // Simulated instant code provisioning for merchant tests
  const cardCode = `USDBT-${brandName.toUpperCase().replace(/\s+/g, '')}-${randomBytes(4).toString('hex').toUpperCase()}`

  const [order] = await sql`
    INSERT INTO merchant_orders
      (merchant_id, external_ref, product_id, brand_name, face_value, recipient_email, status, card_code)
    VALUES
      (${m.id}, ${externalRef || null}, ${productId}, ${brandName}, ${faceValue}, ${recipientEmail}, 'delivered', ${cardCode})
    RETURNING id, external_ref, product_id, brand_name, face_value, recipient_email, status, card_code, created_at
  `

  await sql`
    UPDATE merchants
    SET total_volume = total_volume + ${faceValue}
    WHERE id = ${m.id}
  `

  res.status(201).json({
    orderId: order.id,
    externalRef: order.external_ref,
    status: order.status,
    brandName: order.brand_name,
    faceValue: Number(order.face_value),
    cardCode: order.card_code,
    recipientEmail: order.recipient_email,
    deliveredAt: order.created_at,
  })
})

// 5. Merchant Order Status Inquiry
merchantRouter.get('/orders/:id', requireMerchant, async (req: any, res) => {
  const [order] = await sql`
    SELECT id, external_ref, product_id, brand_name, face_value, recipient_email, status, card_code, created_at
    FROM merchant_orders
    WHERE id = ${req.params.id} AND merchant_id = ${req.merchant.id}
  `
  if (!order) return res.status(404).json({ error: 'merchant order not found' })
  res.json(order)
})
