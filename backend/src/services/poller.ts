import { sql } from '../lib/db'
import { getCROrder } from '../lib/cryptorefills'
import { ORDER_STATUS } from '../lib/order-status'
import { sendDeliveryEmail } from '../lib/email'

const POLL_INTERVAL_MS = 15_000

// Map Cryptorefills order statuses to our internal statuses
function mapCRStatus(crStatus: string): string | null {
  switch (crStatus) {
    case 'Created':
    case 'WaitingForPayment':
    case 'PartialPaymentStarted':
      return ORDER_STATUS.PENDING_PAYMENT
    case 'PaymentStarted':
      return ORDER_STATUS.USER_DEBITED
    case 'PaymentReceived':
      return ORDER_STATUS.HOT_WALLET_FUNDED
    case 'WaitingForDelivery':
    case 'WaitingForManualAction':
      return ORDER_STATUS.BITREFILL_PROCESSING
    case 'Done':
      return ORDER_STATUS.DELIVERED
    case 'Expired':
    case 'PaymentFailed':
    case 'PaymentSetupFailed':
      return ORDER_STATUS.FAILED
    case 'Refunded':
      return ORDER_STATUS.REFUNDED
    default:
      return null  // unknown status — leave unchanged
  }
}

const TERMINAL = new Set<string>([
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.FAILED,
  ORDER_STATUS.REFUNDED,
])

export function startPoller(intervalMs = POLL_INTERVAL_MS): void {
  console.log('[poller] started — checking every', intervalMs / 1000, 's')
  setInterval(pollActiveOrders, intervalMs)
}

async function pollActiveOrders(): Promise<void> {
  const active = await sql`
    SELECT id, cr_order_id, status, expires_at, email, brand_name, face_value
    FROM orders
    WHERE cr_order_id IS NOT NULL
      AND status NOT IN (
        ${ORDER_STATUS.DELIVERED},
        ${ORDER_STATUS.FAILED},
        ${ORDER_STATUS.REFUNDED}
      )
  `
  if (active.length === 0) return

  const now = new Date()

  for (const order of active) {
    try {
      // Mark expired orders that CR hasn't seen yet (no cr_order_id response)
      if (new Date(order.expires_at) <= now && order.status === ORDER_STATUS.PENDING_PAYMENT) {
        await sql`
          UPDATE orders SET status = ${ORDER_STATUS.FAILED}, failure_reason = 'payment window expired'
          WHERE id = ${order.id}
        `
        console.log(`[poller] expired order ${order.id}`)
        continue
      }

      const crOrder = await getCROrder(order.cr_order_id)
      const newStatus = mapCRStatus(crOrder.order_state)

      if (!newStatus || newStatus === order.status) continue

      await sql`
        UPDATE orders SET status = ${newStatus}
        WHERE id = ${order.id}
      `

      if (TERMINAL.has(newStatus)) {
        console.log(`[poller] order ${order.id} → ${newStatus} (CR: ${crOrder.order_state})`)
      }

      // Send a branded confirmation once, when the order is first delivered
      if (newStatus === ORDER_STATUS.DELIVERED && order.email) {
        sendDeliveryEmail(order.email, {
          brandName: order.brand_name,
          faceValue: Number(order.face_value),
        }).catch(() => {})
      }
    } catch (err) {
      console.error(`[poller] error checking order ${order.id}:`, err)
    }
  }
}
