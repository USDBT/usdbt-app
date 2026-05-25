'use client'

import { useEffect, useState, useCallback } from 'react'
import QRCode from 'react-qr-code'
import { Copy, Check, Loader2, Clock } from 'lucide-react'
import { getOrderStatus, type OrderStatus } from '@/lib/api'

const POLL_INTERVAL = 5_000

export function PaymentScreen({
  orderId,
  paymentAddress,
  email,
  onSuccess,
}: {
  orderId: string
  paymentAddress: string
  email: string
  onSuccess: () => void
}) {
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const poll = useCallback(async () => {
    try {
      const status = await getOrderStatus(orderId)
      setOrder(status)
      if (status.status === 'fulfilled') onSuccess()
    } catch {
      setError('Could not reach server. Retrying…')
    }
  }, [orderId, onSuccess])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [poll])

  useEffect(() => {
    if (!order?.expiresAt) return
    const tick = () => {
      const diff = new Date(order.expiresAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expired'); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [order?.expiresAt])

  function copyAddress() {
    navigator.clipboard.writeText(paymentAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }


  if (!order) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-65px)]">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </main>
    )
  }

  const statusLabel: Record<string, string> = {
    pending_payment: 'Waiting for your payment…',
    confirming: 'Payment detected · confirming…',
    fulfilled: 'Fulfilled!',
    failed: 'Order failed',
  }

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <span className="font-mono">02</span>
          <span>Payment</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Send USDC</h1>
        <p className="text-gray-500 text-sm mt-1">
          Send exactly <strong>${order.paymentAmount} USDC</strong> on Base from your connected wallet.
          Your {order.brandName} ${order.faceValue} card will be emailed to{' '}
          <span className="font-medium text-gray-700">{email}</span>.
        </p>
      </div>

      {/* QR */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-4 rounded-2xl border border-[--color-surface-2] shadow-sm">
          <QRCode value={paymentAddress} size={180} />
        </div>
      </div>

      {/* Address */}
      <div className="bg-[--color-surface] rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-400 mb-1.5">Send to (Base network)</p>
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-gray-800 flex-1 break-all leading-relaxed">
            {paymentAddress}
          </code>
          <button
            onClick={copyAddress}
            className="shrink-0 p-1.5 rounded-lg hover:bg-[--color-surface-2] transition-colors text-gray-500"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="bg-[--color-brand] text-white rounded-xl p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs opacity-70 mb-0.5">Exact amount</p>
          <p className="text-xl font-bold font-mono">${order.paymentAmount} USDC</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-70 mb-0.5">Expires in</p>
          <div className="flex items-center gap-1 text-sm font-mono">
            <Clock size={12} />
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 size={14} className={`animate-spin ${order.status === 'confirming' ? 'text-[--color-brand]' : ''}`} />
        {statusLabel[order.status] ?? order.status}
      </div>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      <p className="text-xs text-gray-400 mt-4 leading-relaxed">
        Send from the exact wallet you connected. We match payments by sender address.
      </p>
    </main>
  )
}
