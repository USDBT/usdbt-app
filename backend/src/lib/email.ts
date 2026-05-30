import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY ?? '')
const FROM = process.env.EMAIL_FROM ?? 'cards@mail.usdbt.us'
const DASHBOARD_URL = process.env.FRONTEND_URL ?? 'https://usdbt.us'

export async function sendDeliveryEmail(to: string, opts: { brandName: string; faceValue: number }): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping delivery email')
    return
  }

  const { brandName, faceValue } = opts
  try {
    await resend.emails.send({
      from: `USDBT <${FROM}>`,
      to,
      subject: `Your ${brandName} card is on its way 🎉`,
      html: buildHtml({ brandName, faceValue, dashboardUrl: DASHBOARD_URL }),
    })
    console.log(`[email] delivery email sent to ${to}`)
  } catch (err) {
    console.error('[email] failed to send delivery email:', err)
  }
}

function buildHtml(opts: { brandName: string; faceValue: number; dashboardUrl: string }): string {
  const { brandName, faceValue, dashboardUrl } = opts
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f5fa;padding:40px 0;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eef0ff">
    <div style="background:#2b2bf5;padding:28px 32px;text-align:center">
      <p style="color:rgba(255,255,255,0.7);margin:0 0 4px;font-size:12px;letter-spacing:1px">USDBT</p>
      <h1 style="color:#fff;margin:0;font-size:22px">Card delivered 🎉</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#444;margin:0 0 16px;font-size:15px;line-height:1.6">
        Good news — Cryptorefills has delivered your <strong>$${faceValue} ${brandName}</strong> gift card.
        The redemption code was sent to this email in a separate message from Cryptorefills.
      </p>
      <p style="color:#666;margin:0 0 24px;font-size:14px;line-height:1.6">
        Log in to your dashboard to view your order activity, track spending, or top up your balance to buy more.
      </p>
      <div style="text-align:center;margin-bottom:24px">
        <a href="${dashboardUrl}" style="display:inline-block;background:#2b2bf5;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:12px">
          Open your dashboard
        </a>
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#aaa;font-size:12px;text-align:center;margin:0">
        Powered by USDBT · No KYC · No banks · Just the meme
      </p>
    </div>
  </div>
</body>
</html>`
}
