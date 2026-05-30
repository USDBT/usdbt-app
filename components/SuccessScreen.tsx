'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { getOrderProgress, type OrderProgress } from '@/lib/api'

const POLL_INTERVAL = 5000

const TIMELINE = [
  'Waiting for payment',
  'Payment received',
  'Funding provider wallet',
  'Issuing your card',
] as const

export function SuccessScreen({
  orderId,
  email,
  onReset,
}: {
  orderId: string
  email: string
  onReset: () => void
}) {
  const [progress, setProgress] = useState<OrderProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    let active = true

    async function poll() {
      try {
        const p = await getOrderProgress(orderId)
        if (!active) return
        setProgress(p)
        setError(null)
      } catch {
        if (!active) return
        setError('Could not refresh progress. Retrying…')
      }
    }

    poll()
    timer = setInterval(poll, POLL_INTERVAL)

    return () => {
      active = false
      if (timer) clearInterval(timer)
    }
  }, [orderId])

  const terminalNote = useMemo(() => {
    if (!progress) return null
    if (progress.status === 'delivered') return 'Your card has been delivered to your email.'
    if (progress.status === 'failed') return progress.failureReason ?? 'Order failed. Please contact support.'
    if (progress.status === 'refunded') return progress.failureReason ?? 'Order refunded due to processing issue.'
    return null
  }, [progress])

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-[--color-surface-2]">
        <p className="text-[11px] text-gray-400 mb-0.5 uppercase tracking-wide">Order complete</p>
        <h2 className="font-semibold text-gray-900 text-sm">Card on its way!</h2>
      </div>

      {/* Body */}
      <div className="flex flex-col items-center justify-center flex-1 px-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[--color-brand-light] flex items-center justify-center mb-5">
          <CheckCircle size={28} className="text-[--color-brand]" />
        </div>

        <p className="text-sm font-medium text-gray-800 mb-1">Delivered to</p>
        <p className="text-sm text-[--color-brand] font-semibold mb-4 break-all">{email}</p>

        <p className="text-[11px] text-gray-400 leading-relaxed max-w-[220px] mb-8">
          Your card is being processed and should be ready in ~3 minutes. We’ll deliver it to your inbox automatically.
        </p>

        <div className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 mb-4 text-left">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Progress</p>
          <div className="space-y-1.5">
            {TIMELINE.map((label, idx) => {
              const currentStep = progress?.progress?.step ?? 1
              const done = currentStep > idx + 1
              const current = currentStep === idx + 1 && !progress?.progress?.terminal
              return (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: done || current ? '#2b2bf5' : '#d1d5db',
                    }}
                  />
                  <span className={`text-[11px] ${done || current ? 'text-gray-700' : 'text-gray-400'}`}>
                    {label}
                  </span>
                  {current && <Loader2 size={11} className="animate-spin text-[--color-brand]" />}
                </div>
              )
            })}
          </div>
          {progress?.progress?.terminal && terminalNote && (
            <p className="text-[11px] mt-2 text-gray-500">{terminalNote}</p>
          )}
          {error && <p className="text-[11px] mt-2 text-red-400">{error}</p>}
        </div>

        <button
          onClick={onReset}
          className="w-full py-2.5 rounded-xl text-white text-xs font-semibold transition-colors"
          style={{ backgroundColor: '#2b2bf5' }}
        >
          Buy another card
        </button>
      </div>
    </div>
  )
}
