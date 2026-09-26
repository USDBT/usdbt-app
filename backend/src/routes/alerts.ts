import { Router } from 'express'
import { sql } from '../lib/db'

export const alertsRouter = Router()

alertsRouter.get('/:address', async (req, res) => {
  const addr = req.params.address?.toLowerCase()
  if (!addr) return res.status(400).json({ error: 'wallet address required' })

  const alerts = await sql`
    SELECT id, wallet_address, email, brand_id, brand_name, target_discount_pct, is_active, created_at
    FROM price_alerts
    WHERE lower(wallet_address) = ${addr}
    ORDER BY created_at DESC
  `

  res.json({ alerts })
})

alertsRouter.post('/', async (req, res) => {
  const { walletAddress, email, brandId, brandName, targetDiscountPct } = req.body
  if (!walletAddress || !email || !brandId || !brandName) {
    return res.status(400).json({ error: 'walletAddress, email, brandId, and brandName are required' })
  }

  const [alert] = await sql`
    INSERT INTO price_alerts
      (wallet_address, email, brand_id, brand_name, target_discount_pct, is_active)
    VALUES
      (${walletAddress}, ${email}, ${brandId}, ${brandName}, ${Number(targetDiscountPct) || 3}, true)
    RETURNING id, wallet_address, email, brand_id, brand_name, target_discount_pct, is_active, created_at
  `

  res.status(201).json({
    message: `Price alert set for ${brandName}`,
    alert,
  })
})

alertsRouter.patch('/:id/toggle', async (req, res) => {
  const [updated] = await sql`
    UPDATE price_alerts
    SET is_active = NOT is_active
    WHERE id = ${req.params.id}
    RETURNING id, is_active
  `
  if (!updated) return res.status(404).json({ error: 'alert not found' })
  res.json({ success: true, alert: updated })
})

alertsRouter.delete('/:id', async (req, res) => {
  const [deleted] = await sql`
    DELETE FROM price_alerts WHERE id = ${req.params.id} RETURNING id
  `
  if (!deleted) return res.status(404).json({ error: 'alert not found' })
  res.json({ success: true, message: 'Alert deleted' })
})
