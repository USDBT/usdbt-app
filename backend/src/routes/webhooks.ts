import { createHash } from 'crypto'
import { Router } from 'express'
import { sql } from '../lib/db'
import { ORDER_STATUS } from '../lib/order-status'

export const webhooksRouter = Router()

function eventIdFromBody(body: any): string {
  const raw = body?.eventId ?? body?.event_id ?? body?.id
  if (raw) return String(raw)
  return createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex')
}

webhooksRouter.post('/bitrefill', async (req, res) => {
  try {
    const body = req.body ?? {}
    const eventId = eventIdFromBody(body)
    const markerId = createHash('md5').update(eventId).digest('hex')

    try {
      await sql`
        INSERT INTO webhook_events (id, source, event_key)
        VALUES (${markerId}, 'bitrefill', ${eventId})
      `
    } catch (err) {
      const msg = String(err)
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
        return res.status(200).json({ ok: true, deduped: true })
      }
      throw err
    }

    const invoiceId = String(body?.invoice_id ?? body?.invoiceId ?? '')
    const providerOrderId = String(body?.order_id ?? body?.orderId ?? '')
    const providerStatus = String(body?.status ?? '').toLowerCase()

    if (!invoiceId && !providerOrderId) {
      await sql`UPDATE webhook_events SET state = 'invalid' WHERE id = ${markerId}`
      return res.status(400).json({ error: 'missing invoice/order reference' })
    }

    const [order] = await sql`
      SELECT id FROM orders
      WHERE reloadly_order_id = ANY(ARRAY[${invoiceId}, ${providerOrderId}]::text[])
      LIMIT 1
    `

    if (!order) {
      await sql`
        UPDATE webhook_events
        SET invoice_id = ${invoiceId || null}, provider_order_id = ${providerOrderId || null},
            provider_status = ${providerStatus || null}, state = 'ignored'
        WHERE id = ${markerId}
      `
      return res.status(202).json({ ok: true, ignored: 'order not found' })
    }

    if (['delivered', 'complete', 'completed', 'fulfilled'].includes(providerStatus)) {
      await sql`UPDATE orders SET status = ${ORDER_STATUS.DELIVERED} WHERE id = ${order.id}`
    } else if (['failed', 'expired', 'cancelled', 'canceled'].includes(providerStatus)) {
      await sql`
        UPDATE orders
        SET status = ${ORDER_STATUS.REFUNDED},
            failure_reason = ${'bitrefill webhook status=' + providerStatus}
        WHERE id = ${order.id}
      `
    }

    await sql`
      UPDATE webhook_events
      SET invoice_id = ${invoiceId || null}, provider_order_id = ${providerOrderId || null},
          provider_status = ${providerStatus || null}, state = 'processed'
      WHERE id = ${markerId}
    `
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[webhooks] bitrefill error:', err)
    return res.status(500).json({ error: 'webhook handling failed' })
  }
})
