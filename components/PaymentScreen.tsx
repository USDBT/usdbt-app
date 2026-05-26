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
      if (
        status.status === 'user_debited' ||
        status.status === 'hot_wallet_funded' ||
        status.status === 'bitrefill_processing' ||
        status.status === 'delivered'
      ) {
        onSuccess()
      }
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
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-gray-300" />
      </div>
    )
  }

  const statusMap: Record<string, string> = {
    pending_payment: 'Waiting for payment…',
    user_debited: 'Payment detected · preparing your card…',
    hot_wallet_funded: 'Funding hot wallet…',
    bitrefill_processing: 'Issuing card with provider…',
    delivered: 'Card delivered!',
    failed: 'Order failed',
    refunded: 'Order refunded',
  }

  const isConfirming = ['user_debited', 'hot_wallet_funded', 'bitrefill_processing'].includes(order.status)

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-[--color-surface-2]">
        <p className="text-[11px] text-gray-400 mb-0.5 uppercase tracking-wide">Send payment</p>
        <h2 className="font-semibold text-gray-900 text-sm">
          {order.brandName} · ${order.faceValue}
        </h2>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Amount chip */}
        <div className="flex items-center justify-between bg-[--color-brand] text-white rounded-xl px-4 py-3">
          <div>
            <p className="text-[10px] opacity-70 mb-0.5">Exact amount</p>
            <p className="text-lg font-bold">${order.paymentAmount} USDC</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] opacity-70 mb-0.5">Expires in</p>
            <div className="flex items-center gap-1 text-xs font-medium">
              <Clock size={11} />
              {timeLeft}
            </div>
          </div>
        </div>

        {/* QR */}
        <div className="flex justify-center">
          <div className="bg-white p-3.5 rounded-2xl border border-[--color-surface-2] shadow-sm">
            <QRCode value={paymentAddress} size={160} />
          </div>
        </div>

        {/* Address */}
        <div className="bg-[--color-surface] rounded-xl p-3.5">
          <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide">Base network address</p>
          <div className="flex items-start gap-2">
            <code className="text-[11px] font-mono text-gray-700 flex-1 break-all leading-relaxed">
              {paymentAddress}
            </code>
            <button
              onClick={copyAddress}
              className="shrink-0 p-1.5 rounded-lg hover:bg-[--color-surface-2] transition-colors text-gray-400"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-xs text-gray-500 py-1">
          <Loader2
            size={13}
            className={`animate-spin ${isConfirming ? 'text-[--color-brand]' : 'text-gray-300'}`}
          />
          {statusMap[order.status] ?? order.status}
        </div>

        {error && <p className="text-[11px] text-red-400">{error}</p>}

        <p className="text-[11px] text-gray-400 leading-relaxed">
          Send from the wallet you connected. We match payments by sender address.
          Card for <span className="text-gray-600">{email}</span>.
        </p>
      </div>
    </div>
  )
}
