'use client'

import { X, ChevronDown, MessageCircle, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useIsMobile } from '@/hooks/useIsMobile'

const SPRING = { type: 'spring' as const, damping: 32, stiffness: 300 }

const FAQ = [
  { q: 'How do I buy a gift card?', a: 'Connect your wallet, pick a card, enter your email, choose USDG or ETH, and approve the payment in your wallet. Your card code arrives in your inbox within minutes.' },
  { q: 'Which wallets are supported?', a: 'Any EVM wallet that can connect to Robinhood Chain: MetaMask, Rainbow, and 100+ others via WalletConnect. The app adds and switches to the network for you.' },
  { q: 'Do I need KYC?', a: 'No. We never ask for ID, email verification, or any personal information beyond the delivery email for your card.' },
  { q: "What if my payment isn't detected?", a: 'Payments usually confirm within seconds of your wallet approving them. If 30+ minutes pass with no confirmation, reach out via Telegram with your order ID.' },
  { q: 'Which network do I pay on?', a: 'Robinhood Chain. You pay in USDG or ETH held on Robinhood Chain, and your wallet signs the payment directly, so there is no address to copy.' },
  { q: 'Can I get a refund?', a: 'Once a card is delivered it cannot be refunded. If payment was sent but no card received within 1 hour, contact support.' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-50 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3.5 text-left gap-3"
      >
        <span className="text-sm font-medium text-gray-800">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-xs text-gray-500 leading-relaxed pb-3.5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function HelpDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isMobile = useIsMobile()

  const slideIn  = isMobile ? { y: 0 }      : { x: 0 }
  const slideOut = isMobile ? { y: '100%' } : { x: '100%' }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="help-backdrop"
            className="fixed inset-0 z-50 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            key="help-panel"
            className={[
              'fixed z-50 bg-white shadow-2xl flex flex-col',
              'inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh]',
              'md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:w-full md:max-w-sm md:rounded-none md:max-h-none',
            ].join(' ')}
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={slideIn}
            exit={slideOut}
            transition={SPRING}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 md:hidden" />

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Help & FAQ</h2>
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.88 }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={16} />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Frequently Asked</p>
              <div className="bg-white rounded-xl border border-gray-100 px-4 mb-5">
                {FAQ.map((item) => <FaqItem key={item.q} {...item} />)}
              </div>

              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Contact</p>
              <div className="space-y-2">
                <motion.a
                  href="https://t.me/usdbt"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-gray-300 transition-colors"
                >
                  <MessageCircle size={16} className="text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Telegram Support</p>
                    <p className="text-xs text-gray-400">Fastest response</p>
                  </div>
                  <ExternalLink size={13} className="text-gray-300" />
                </motion.a>
                <motion.a
                  href="https://usdbt.us"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-gray-300 transition-colors"
                >
                  <ExternalLink size={16} className="text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Documentation</p>
                    <p className="text-xs text-gray-400">usdbt.us/docs</p>
                  </div>
                  <ExternalLink size={13} className="text-gray-300" />
                </motion.a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
