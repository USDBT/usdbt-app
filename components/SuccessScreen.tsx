'use client'

import { CheckCircle } from 'lucide-react'

export function SuccessScreen({
  email,
  onReset,
}: {
  email: string
  onReset: () => void
}) {
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
          Check your inbox. Sometimes takes a minute. Check spam too, just in case.
        </p>

        <button
          onClick={onReset}
          className="w-full py-2.5 rounded-xl bg-[--color-brand] text-white text-xs font-semibold hover:bg-[--color-brand-hover] transition-colors"
        >
          Buy another card
        </button>
      </div>
    </div>
  )
}
