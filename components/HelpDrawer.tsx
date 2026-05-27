'use client'

import { X, ChevronDown, MessageCircle, ExternalLink } from 'lucide-react'
import { useState } from 'react'

const FAQ = [
  {
    q: 'How do I buy a gift card?',
    a: 'Connect your wallet, pick a card, enter your email, and send USDC to the payment address. Your card code arrives in your inbox within minutes.',
  },
  {
    q: 'Which wallets are supported?',
    a: 'Any wallet that works on Base — MetaMask, Coinbase Wallet, Rainbow, and 100+ others via WalletConnect.',
  },
  {
    q: 'Do I need KYC?',
    a: 'No. We never ask for ID, email verification, or any personal information beyond the delivery email for your card.',
  },
  {
    q: "What if my payment isn't detected?",
    a: 'Payments are monitored every 15 seconds. If 30+ minutes pass with no detection, reach out via Telegram. Always send from the wallet you connected.',
  },
  {
    q: 'Which network do I pay on?',
    a: 'Base mainnet only. Do not send from Ethereum mainnet or other chains — funds sent to the wrong network cannot be recovered.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Once a card is delivered it cannot be refunded. If payment was sent but no card received within 1 hour, contact support.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-50 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3.5 text-left gap-3 active:bg-gray-50 transition-colors rounded-lg"
      >
        <span className="text-sm font-medium text-gray-800">{q}</span>
        <ChevronDown
          size={14}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-40 pb-3.5' : 'max-h-0'}`}>
        <p className="text-xs text-gray-500 leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

export function HelpDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={[
        'fixed z-50 bg-white shadow-2xl flex flex-col',
        'transition-transform duration-300 ease-in-out',
        'inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh]',
        'md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:w-full md:max-w-sm md:rounded-none md:max-h-none',
        open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full',
      ].join(' ')}>
        {/* Drag handle (mobile only) */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Help & FAQ</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 active:scale-95 text-gray-400 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Frequently Asked</p>
          <div className="bg-white rounded-xl border border-gray-100 px-4 mb-5">
            {FAQ.map((item) => <FaqItem key={item.q} {...item} />)}
          </div>

          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Contact</p>
          <div className="space-y-2">
            <a
              href="https://t.me/usdbt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-gray-300 active:scale-[0.98] transition-all"
            >
              <MessageCircle size={16} className="text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Telegram Support</p>
                <p className="text-xs text-gray-400">Fastest response</p>
              </div>
              <ExternalLink size={13} className="text-gray-300" />
            </a>
            <a
              href="https://usdbt.us"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-gray-300 active:scale-[0.98] transition-all"
            >
              <ExternalLink size={16} className="text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Documentation</p>
                <p className="text-xs text-gray-400">usdbt.us/docs</p>
              </div>
              <ExternalLink size={13} className="text-gray-300" />
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
