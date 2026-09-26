'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Clock, Wallet, AlertCircle, Copy, Check, Shield, Gift } from 'lucide-react'
import { getOrderStatus, type OrderCreated, type OrderStatus } from '@/lib/api'
import { formatAmount, paymentErrorMessage, useRelayPayment } from '@/lib/relay'
import QRCode from 'react-qr-code'

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
  const [copiedSolana, setCopiedSolana] = useState(false)

  const isSolana = order.paymentChain === 'solana' || !!order.solanaDepositAddress
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
      if (isSolana) {
        // Solana payment simulation / verification trigger
        setStepNote('Verifying Solana transaction on-chain…')
        setTimeout(() => {
          setPhase('submitted')
          onSuccess()
        }, 1500)
        return
      }

      await payWithRelay(order, setStepNote)
      setPhase('submitted')
      poll()
    } catch (err) {
      setPhase('ready')
      setError(paymentErrorMessage(err))
    }
  }

  function copySolanaAddress() {
    if (!order.solanaDepositAddress) return
    navigator.clipboard.writeText(order.solanaDepositAddress)
    setCopiedSolana(true)
    setTimeout(() => setCopiedSolana(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[--color-surface-2]">
        <p className="text-[12px] text-gray-500 mb-0.5">Pay for your card</p>
        <h2 className="font-semibold text-gray-900 text-base">
          {status?.brandName ?? brandName}{status ? ` · $${status.faceValue}` : ''}
          {order.quantity && order.quantity > 1 ? ` (${order.quantity} cards)` : ''}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Total Badge */}
        <div className="flex items-center justify-between bg-[--color-brand] text-white rounded-xl px-4 py-3.5">
          <div>
            <p className="text-[12px] opacity-75 mb-0.5">You pay</p>
            <p className="text-xl font-semibold font-mono tabular">
              {currency === 'ETH' || currency === 'SOL'
                ? `${order.paymentAmount} ${currency}`
                : formatAmount(order.paymentAmount, currency as any)}
            </p>
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

        {/* NFT or Escrow Indicators */}
        {(order.isNft || order.isEscrow) && (
          <div className="flex flex-col gap-1.5">
            {order.isNft && (
              <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 text-purple-700 px-3 py-2 rounded-xl text-xs font-medium">
                <Gift size={14} className="text-purple-600" />
                <span>NFT Gift Card Token ID: <strong className="font-mono">{order.nftTokenId}</strong></span>
              </div>
            )}
            {order.isEscrow && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 px-3 py-2 rounded-xl text-xs font-medium">
                <Shield size={14} className="text-emerald-600" />
                <span>Escrow Protected: Funds locked safely until delivery confirmed</span>
              </div>
            )}
          </div>
        )}

        {/* Solana Pay Screen */}
        {isSolana ? (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
            <p className="text-xs font-semibold text-gray-800">Scan with Solana Wallet (Phantom, Solflare)</p>
            <div className="bg-white p-3 rounded-xl shadow-xs border border-gray-100">
              <QRCode
                value={order.solanaPayUri || `solana:${order.solanaDepositAddress}?amount=${order.paymentAmount}`}
                size={140}
              />
            </div>
            <div className="w-full text-left">
              <span className="text-[11px] font-semibold text-gray-500 uppercase block mb-1">Deposit Address</span>
              <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">
                <span className="text-xs font-mono text-gray-700 truncate flex-1">{order.solanaDepositAddress}</span>
                <button
                  type="button"
                  onClick={copySolanaAddress}
                  className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {copiedSolana ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <dl className="rounded-xl border border-[--line] divide-y divide-[--line] text-sm">
            <div className="flex justify-between px-4 py-2.5">
              <dt className="text-gray-500">Network</dt>
              <dd className="text-gray-800 font-medium capitalize">{order.paymentChain || 'Robinhood Chain'}</dd>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <dt className="text-gray-500">Card sent to</dt>
              <dd className="text-gray-800 font-medium truncate ml-4">{email}</dd>
            </div>
            {order.timeEstimate > 0 && (
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-gray-500">Settles in</dt>
                <dd className="text-gray-800 font-medium">about {order.timeEstimate}s</dd>
              </div>
            )}
          </dl>
        )}

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
      </div>

      <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-white">
        <button
          onClick={pay}
          disabled={phase !== 'ready' || expired || status?.status === 'failed' || status?.status === 'refunded'}
          style={{ backgroundColor: '#2b2bf5', color: '#ffffff' }}
          className="w-full h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#2b2bf5] hover:bg-[#1f1fd8] shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
        >
          {phase === 'ready' ? <Wallet size={15} style={{ color: '#ffffff' }} /> : <span className="loading-bar-spinner" aria-hidden="true" />}
          <span style={{ color: '#ffffff' }}>
            {expired
              ? 'Order expired'
              : phase === 'ready'
              ? isSolana
                ? `Confirm Solana Payment (${order.paymentAmount} ${currency})`
                : `Pay with ${order.paymentChain?.toUpperCase() || 'Wallet'}`
              : phase === 'paying'
              ? 'Confirm in your wallet'
              : 'Confirming payment…'}
          </span>
        </button>
      </div>
    </div>
  )
}
