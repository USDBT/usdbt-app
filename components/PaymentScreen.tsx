'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Clock, Wallet, AlertCircle } from 'lucide-react'
import { getOrderStatus, type OrderCreated, type OrderStatus } from '@/lib/api'
import { formatAmount, useRelayPayment } from '@/lib/relay'

const POLL_INTERVAL = 5_000
const PAID_STATUSES: OrderStatus['status'][] = ['user_debited', 'hot_wallet_funded', 'bitrefill_processing', 'delivered']

type Phase = 'ready' | 'paying' | 'submitted'

export function PaymentScreen({
  order,
  brandName,
  email,
  onSuccess,
}: {
  order: OrderCreated
  brandName: string
  email: string
  onSuccess: () => void
}) {
  const payWithRelay = useRelayPayment()
  const [status, setStatus] = useState<OrderStatus | null>(null)
  const [phase, setPhase] = useState<Phase>('ready')
  const [stepNote, setStepNote] = useState('')
  const [timeLeft, setTimeLeft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const currency = order.paymentCurrency ?? 'USDG'
  const expiresAt = status?.expiresAt ?? order.expiresAt
  const expired = timeLeft === 'Expired'

  const poll = useCallback(async () => {
    try {
      const s = await getOrderStatus(order.orderId)
      setStatus(s)
      if (PAID_STATUSES.includes(s.status)) onSuccess()
      if (s.status === 'failed' || s.status === 'refunded') {
        setError(s.failureReason || (s.status === 'refunded' ? 'This order was refunded.' : 'This order failed.'))
      }
    } catch {
      // Keep polling; a missed poll is not an error the user can act on.
    }
  }, [order.orderId, onSuccess])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [poll])

  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expired'); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  async function pay() {
    setError(null)
    setPhase('paying')
    try {
      await payWithRelay(order, setStepNote)
      setPhase('submitted')
      poll()
    } catch (err) {
      setPhase('ready')
      const message = err instanceof Error ? err.message : 'Payment could not be completed.'
      // Wallets report a rejected prompt as a long technical error; keep the first line.
      setError(/rejected|denied/i.test(message) ? 'You declined the request in your wallet. Try again when ready.' : message.split('\n')[0])
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[--color-surface-2]">
        <p className="text-[12px] text-gray-500 mb-0.5">Pay for your card</p>
        <h2 className="font-semibold text-gray-900 text-base">
          {status?.brandName ?? brandName}{status ? ` · $${status.faceValue}` : ''}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        <div className="flex items-center justify-between bg-[--color-brand] text-white rounded-xl px-4 py-3.5">
          <div>
            <p className="text-[12px] opacity-75 mb-0.5">You pay</p>
            <p className="text-xl font-semibold font-mono tabular">{formatAmount(order.paymentAmount, currency)}</p>
          </div>
          {timeLeft && (
            <div className="text-right">
              <p className="text-[12px] opacity-75 mb-0.5">Expires in</p>
              <div className="flex items-center justify-end gap-1 text-sm font-medium font-mono tabular">
                <Clock size={13} />
                {timeLeft}
              </div>
            </div>
          )}
        </div>

        <dl className="rounded-xl border border-[--line] divide-y divide-[--line] text-sm">
          <div className="flex justify-between px-4 py-2.5"><dt className="text-gray-500">Network</dt><dd className="text-gray-800 font-medium">Robinhood Chain</dd></div>
          <div className="flex justify-between px-4 py-2.5"><dt className="text-gray-500">Card sent to</dt><dd className="text-gray-800 font-medium truncate ml-4">{email}</dd></div>
          {order.timeEstimate > 0 && (
            <div className="flex justify-between px-4 py-2.5"><dt className="text-gray-500">Settles in</dt><dd className="text-gray-800 font-medium">about {order.timeEstimate}s</dd></div>
          )}
        </dl>

        {phase === 'paying' && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Loader2 size={16} className="animate-spin text-[--color-brand] mt-0.5 flex-shrink-0" />
            <span>{stepNote || 'Opening your wallet…'}</span>
          </div>
        )}
        {phase === 'submitted' && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Loader2 size={16} className="animate-spin text-[--color-brand] mt-0.5 flex-shrink-0" />
            <span>Payment sent. Waiting for it to confirm…</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-[12px] text-gray-500 leading-relaxed">
          Your wallet will ask you to approve {order.steps?.length > 1 ? 'a few transactions' : 'a transaction'} on Robinhood Chain.
          It switches networks for you if needed.
        </p>
      </div>

      <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
        <button
          onClick={pay}
          disabled={phase !== 'ready' || expired || status?.status === 'failed' || status?.status === 'refunded'}
          className="btn btn-primary btn-block"
        >
          {phase === 'ready' ? <Wallet size={16} /> : <span className="loading-bar-spinner" aria-hidden="true" />}
          {expired ? 'Order expired' : phase === 'ready' ? `Pay ${formatAmount(order.paymentAmount, currency)}` : phase === 'paying' ? 'Confirm in your wallet' : 'Confirming payment…'}
        </button>
      </div>
    </div>
  )
}
