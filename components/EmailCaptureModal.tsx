'use client'

import { useState } from 'react'
import { Mail, X } from 'lucide-react'
import { toast } from 'sonner'
import { authHeaders, storeEmail } from '@/lib/auth'

interface Props {
  walletAddress: string
  onSaved: (email: string) => void
  onDismiss: () => void
}

export function EmailCaptureModal({ walletAddress, onSaved, onDismiss }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? ''}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(walletAddress) },
        body: JSON.stringify({ walletAddress, email: email.trim() }),
      })
      if (!res.ok) throw new Error('Failed to save')
      storeEmail(email.trim(), walletAddress)
      toast.success('Email saved — your cards will be delivered here')
      onSaved(email.trim())
    } catch {
      toast.error('Could not save email. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onDismiss} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#eef0ff' }}>
              <Mail size={18} style={{ color: '#2b2bf5' }} />
            </div>
            <button onClick={onDismiss} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={15} />
            </button>
          </div>

          <h2 className="text-base font-semibold text-gray-900 mb-1">Where should we send your cards?</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-5">
            We use this email <span className="font-medium text-gray-600">solely</span> to deliver your gift card codes when your order is confirmed. No marketing, no spam.
          </p>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2b2bf5] focus:ring-1 focus:ring-[#2b2bf5] transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[inset_6px_6px_14px_rgba(255,255,255,0.12),inset_-6px_-6px_14px_rgba(255,255,255,0.12)] hover:shadow-[inset_8px_8px_20px_rgba(255,255,255,0.22),inset_-8px_-8px_20px_rgba(255,255,255,0.22)]"
              style={{ backgroundColor: '#2b2bf5' }}
            >
              {loading && <span className="loading-bar-spinner" aria-hidden="true" />}
              {loading ? 'Saving…' : 'Save & Continue'}
            </button>
          </form>

          <button
            onClick={onDismiss}
            className="w-full mt-2 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </>
  )
}
