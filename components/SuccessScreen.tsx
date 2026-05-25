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
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[--color-brand] flex items-center justify-center mb-6">
        <CheckCircle size={32} className="text-white" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2">Card on its way!</h1>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-1">
        We&apos;re sending your gift card to
      </p>
      <p className="font-medium text-gray-800 mb-6">{email}</p>

      <p className="text-xs text-gray-400 mb-8 max-w-xs leading-relaxed">
        Check your inbox. Sometimes it takes a minute. Check spam too just in case.
      </p>

      <button
        onClick={onReset}
        className="px-6 py-2.5 rounded-xl bg-[--color-brand] text-white text-sm font-semibold hover:bg-[--color-brand-hover] transition-colors"
      >
        Buy another card
      </button>
    </main>
  )
}
