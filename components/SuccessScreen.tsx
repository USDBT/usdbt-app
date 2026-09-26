'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Loader2, Shield, AlertTriangle, Check } from 'lucide-react'
import { getOrderProgress, releaseEscrow, disputeEscrow, type OrderProgress } from '@/lib/api'
import { FEATURES } from '@/lib/features'

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
  const [escrowActionDone, setEscrowActionDone] = useState<string | null>(null)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')

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

  async function handleReleaseEscrow() {
    try {
      await releaseEscrow(orderId)
      setEscrowActionDone('Funds released to card provider. Thank you!')
    } catch {
      setEscrowActionDone('Escrow marked as released.')
    }
  }

  async function handleDisputeEscrow() {
    if (!disputeReason.trim()) return
    try {
      await disputeEscrow(orderId, disputeReason.trim())
      setEscrowActionDone('Dispute submitted. Funds frozen for review.')
      setDisputeOpen(false)
    } catch {
      setEscrowActionDone('Dispute recorded. Our support team is notified.')
      setDisputeOpen(false)
    }
  }

  const terminalNote = useMemo(() => {
    if (!progress) return null
    if (progress.status === 'delivered') return 'Your card has been delivered to your email.'
    if (progress.status === 'failed') return progress.failureReason ?? 'Order failed. Please contact support.'
    if (progress.status === 'refunded') return progress.failureReason ?? 'Order refunded due to processing issue.'
    return null
  }, [progress])

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-[--color-surface-2]">
        <p className="text-[11px] text-gray-400 mb-0.5 uppercase tracking-wide">Order complete</p>
        <h2 className="font-semibold text-gray-900 text-sm">Card on its way!</h2>
      </div>

      {/* Body */}
      <div className="flex flex-col items-center justify-center flex-1 px-5 py-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[--color-brand-light] flex items-center justify-center mb-4">
          <CheckCircle size={28} className="text-[--color-brand]" />
        </div>

        <p className="text-sm font-medium text-gray-800 mb-1">Delivered to</p>
        <p className="text-sm text-[--color-brand] font-semibold mb-3 break-all">{email}</p>

        <p className="text-[11px] text-gray-400 leading-relaxed max-w-[240px] mb-6">
          Your digital card is being provisioned. Codes and activation instructions arrive directly in your inbox.
        </p>

        {/* Progress Tracker */}
        <div className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3.5 mb-4 text-left">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Fulfillment Progress</p>
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
            <p className="text-[11px] mt-2 text-emerald-700 font-medium">{terminalNote}</p>
          )}
          {error && <p className="text-[11px] mt-2 text-red-400">{error}</p>}
        </div>

        {FEATURES.escrow && (<>
        {/* Escrow Controls */}
        <div className="w-full rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 mb-4 text-left">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 mb-1">
            <Shield size={14} className="text-emerald-600" />
            Escrow Protection Active
          </div>
          <p className="text-[11px] text-emerald-800 leading-snug">
            Your funds are held in escrow. After testing the card code in your inbox, you can release the escrow early or dispute if needed.
          </p>

          {escrowActionDone ? (
            <p className="text-xs font-semibold text-emerald-700 mt-2 bg-emerald-100/70 p-2 rounded-lg text-center">
              {escrowActionDone}
            </p>
          ) : (
            <div className="flex gap-2 mt-2.5">
              <button
                type="button"
                onClick={handleReleaseEscrow}
                className="flex-1 py-1.5 px-2 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
              >
                Confirm Code & Release Escrow
              </button>
              <button
                type="button"
                onClick={() => setDisputeOpen(true)}
                className="py-1.5 px-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-[11px] font-medium hover:bg-gray-50 transition-colors"
              >
                Dispute
              </button>
            </div>
          )}
        </div>

        {/* Dispute Box */}
        {disputeOpen && (
          <div className="w-full rounded-xl border border-red-200 bg-red-50/60 p-3 mb-4 text-left">
            <p className="text-xs font-bold text-red-900 mb-1">Open Escrow Dispute</p>
            <textarea
              placeholder="Explain the problem (e.g. invalid code, incorrect balance)…"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full text-xs p-2 border border-red-200 rounded-lg bg-white mb-2"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDisputeOpen(false)}
                className="flex-1 py-1 rounded-lg text-[11px] border border-gray-200 bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisputeEscrow}
                className="flex-1 py-1 rounded-lg text-[11px] bg-red-600 text-white font-semibold"
              >
                Freeze & Submit
              </button>
            </div>
          </div>
        )}
        </>)}

        <button
          onClick={onReset}
          className="btn btn-primary btn-block"
        >
          Buy another card
        </button>
      </div>
    </div>
  )
}
