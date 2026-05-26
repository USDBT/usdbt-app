import { createHash } from 'crypto'
import { Router } from 'express'
import { databases, requiredEnv } from '../lib/appwrite'
import { ORDER_STATUS } from '../lib/order-status'

export const webhooksRouter = Router()

const DB = requiredEnv('APPWRITE_DATABASE_ID')
const COL = requiredEnv('APPWRITE_ORDERS_COLLECTION_ID')
const WEBHOOK_EVENTS_COL = process.env.APPWRITE_WEBHOOK_EVENTS_COLLECTION_ID ?? 'webhook_events'

function eventIdFromBody(body: any): string {
  const raw = body?.eventId ?? body?.event_id ?? body?.id
  if (raw) return String(raw)
  return createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex')
}

function eventDocId(eventId: string): string {
  return createHash('md5').update(eventId).digest('hex')
}

webhooksRouter.post('/bitrefill', async (req, res) => {
  try {
    const body = req.body ?? {}
    const eventId = eventIdFromBody(body)
    const markerId = eventDocId(eventId)

    try {
      await databases.createDocument(DB, WEBHOOK_EVENTS_COL, markerId, {
        source: 'bitrefill',
        eventKey: eventId,
        state: 'received',
      })
    } catch (err) {
      const msg = String(err)
      if (msg.toLowerCase().includes('already exists')) {
        return res.status(200).json({ ok: true, deduped: true })
      }
      throw err
    }

    const invoiceId = String(body?.invoice_id ?? body?.invoiceId ?? '')
    const providerOrderId = String(body?.order_id ?? body?.orderId ?? '')
    const providerStatus = String(body?.status ?? '').toLowerCase()

    if (!invoiceId && !providerOrderId) {
      await databases.updateDocument(DB, WEBHOOK_EVENTS_COL, markerId, {
        state: 'invalid',
      })
      return res.status(400).json({ error: 'missing invoice/order reference' })
    }

    const result = await databases.listDocuments(DB, COL)
    const docs = (result.documents ?? []) as any[]
    const order = docs.find((d) =>
      (invoiceId && String(d.reloadlyOrderId ?? '') === invoiceId) ||
      (providerOrderId && String(d.reloadlyOrderId ?? '') === providerOrderId)
    )

    if (!order) {
      await databases.updateDocument(DB, WEBHOOK_EVENTS_COL, markerId, {
        invoiceId: invoiceId || undefined,
        providerOrderId: providerOrderId || undefined,
        providerStatus: providerStatus || undefined,
        state: 'ignored',
      })
      return res.status(202).json({ ok: true, ignored: 'order not found' })
    }

    if (['delivered', 'complete', 'completed', 'fulfilled'].includes(providerStatus)) {
      await databases.updateDocument(DB, COL, order.$id, { status: ORDER_STATUS.DELIVERED })
    } else if (['failed', 'expired', 'cancelled', 'canceled'].includes(providerStatus)) {
      await databases.updateDocument(DB, COL, order.$id, {
        status: ORDER_STATUS.REFUNDED,
        failureReason: `bitrefill webhook status=${providerStatus}`,
      })
    }
    await databases.updateDocument(DB, WEBHOOK_EVENTS_COL, markerId, {
      invoiceId: invoiceId || undefined,
      providerOrderId: providerOrderId || undefined,
      providerStatus: providerStatus || undefined,
      state: 'processed',
    })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[webhooks] bitrefill error:', err)
    return res.status(500).json({ error: 'webhook handling failed' })
  }
})
