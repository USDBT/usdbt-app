import { sql } from '../lib/db'
import { createInvoice, payInvoice } from '../lib/bitrefill'
import { resend } from '../lib/email'
import { ORDER_STATUS } from '../lib/order-status'

const FROM = process.env.EMAIL_FROM ?? 'cards@usdbt.us'

export async function fulfillOrder(orderId: string): Promise<void> {
  await sql`UPDATE orders SET status = ${ORDER_STATUS.HOT_WALLET_FUNDED} WHERE id = ${orderId}`

  let invoice
  try {
    await sql`UPDATE orders SET status = ${ORDER_STATUS.BITREFILL_PROCESSING} WHERE id = ${orderId}`

    const [order] = await sql`
      SELECT brand_id, face_value, email, brand_name FROM orders WHERE id = ${orderId}
    `

    invoice = await createInvoice(order.brand_id, order.face_value, 1)
    await sql`UPDATE orders SET reloadly_order_id = ${invoice.id} WHERE id = ${orderId}`

    const paid = await payInvoice(invoice.id)
    const fulfilledOrder = paid.orders?.[0]
    const codes = fulfilledOrder?.codes ?? []
    const code = codes[0]?.code ?? ''
    const pin = codes[0]?.pin ?? ''

    await sql`
      UPDATE orders SET status = ${ORDER_STATUS.DELIVERED}, reloadly_order_id = ${fulfilledOrder?.id ?? invoice.id}
      WHERE id = ${orderId}
    `

    await resend.emails.send({
      from: FROM,
      to: order.email,
      subject: `Your ${order.brand_name} gift card — $${order.face_value}`,
      html: buildEmailHtml({
        brandName: order.brand_name,
        faceValue: order.face_value,
        code,
        pin,
        redemptionInfo: fulfilledOrder?.redemptionInfo,
      }),
    })
  } catch (err) {
    const [order] = await sql`SELECT status FROM orders WHERE id = ${orderId}`
    const wasUserDebited = order && [
      ORDER_STATUS.USER_DEBITED,
      ORDER_STATUS.HOT_WALLET_FUNDED,
      ORDER_STATUS.BITREFILL_PROCESSING,
    ].includes(order.status)

    await sql`
      UPDATE orders
      SET status = ${wasUserDebited ? ORDER_STATUS.REFUNDED : ORDER_STATUS.FAILED},
          failure_reason = ${String(err)}
      WHERE id = ${orderId}
    `
    throw err
  }
}

function buildEmailHtml(opts: {
  brandName: string
  faceValue: number
  code: string
  pin?: string
  redemptionInfo?: string
}): string {
  const { brandName, faceValue, code, pin, redemptionInfo } = opts
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f4f5fa;padding:40px 0;margin:0">
  <div style="max-width:500px;margin:0 auto;background:white;border-radius:16px;overflow:hidden">
    <div style="background:#2b2bf5;padding:32px;text-align:center">
      <p style="color:rgba(255,255,255,0.7);margin:0 0 4px;font-size:13px">USDBT</p>
      <h1 style="color:white;margin:0;font-size:24px">Your ${brandName} gift card</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#555;margin:0 0 24px">Here's your $${faceValue} ${brandName} gift card. Keep this safe.</p>
      <div style="background:#f4f5fa;border-radius:12px;padding:20px;margin-bottom:16px;text-align:center">
        <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">Card Code</p>
        <p style="margin:0;font-size:22px;font-weight:700;font-family:monospace;letter-spacing:3px;color:#111">${code}</p>
      </div>
      ${pin ? `
      <div style="background:#f4f5fa;border-radius:12px;padding:20px;margin-bottom:16px;text-align:center">
        <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">PIN</p>
        <p style="margin:0;font-size:22px;font-weight:700;font-family:monospace;letter-spacing:3px;color:#111">${pin}</p>
      </div>` : ''}
      ${redemptionInfo ? `<p style="color:#555;font-size:14px;margin-top:16px">${redemptionInfo}</p>` : ''}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#aaa;font-size:12px;text-align:center;margin:0">
        Powered by USDBT · No KYC · No banks · Just the meme
      </p>
    </div>
  </div>
</body>
</html>`
}
