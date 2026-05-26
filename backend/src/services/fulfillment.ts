import { databases, requiredEnv } from '../lib/appwrite'
import { createInvoice, payInvoice, getInvoice } from '../lib/bitrefill'
import { resend } from '../lib/email'

const DB = requiredEnv('APPWRITE_DATABASE_ID')
const COL = requiredEnv('APPWRITE_ORDERS_COLLECTION_ID')
const FROM = process.env.EMAIL_FROM ?? 'cards@usdbt.us'

export async function fulfillOrder(orderId: string): Promise<void> {
  await databases.updateDocument(DB, COL, orderId, { status: 'confirming' })

  let invoice
  try {
    invoice = await createInvoice(
      await getOrderField(orderId, 'brandId'),
      await getOrderField(orderId, 'faceValue'),
      1,
    )

    const paid = await payInvoice(invoice.id)
    const order = paid.orders?.[0]
    const codes = order?.codes ?? []
    const code = codes[0]?.code ?? ''
    const pin = codes[0]?.pin ?? ''

    await databases.updateDocument(DB, COL, orderId, {
      status: 'fulfilled',
      reloadlyOrderId: order?.id ?? invoice.id,
    })

    const email = await getOrderField(orderId, 'email')
    const brandName = await getOrderField(orderId, 'brandName')
    const faceValue = await getOrderField(orderId, 'faceValue')

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Your ${brandName} gift card — $${faceValue}`,
      html: buildEmailHtml({ brandName, faceValue, code, pin, redemptionInfo: order?.redemptionInfo }),
    })
  } catch (err) {
    await databases.updateDocument(DB, COL, orderId, {
      status: 'failed',
      failureReason: String(err),
    })
    throw err
  }
}

async function getOrderField(orderId: string, field: string): Promise<any> {
  const doc = await databases.getDocument(DB, COL, orderId)
  return (doc as any)[field]
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
