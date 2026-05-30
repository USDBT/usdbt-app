'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  X, Check, Minus, Plus,
  DollarSign, CreditCard, Mail,
  Tag, FolderOpen, Globe, Zap, ShieldCheck,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { createOrder, getWalletBalances, priceLabel, titleize, type Product } from '@/lib/api'

function SectionLabel({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <Icon size={12} className="text-gray-400" />
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{text}</p>
    </div>
  )
}

export function OrderForm({
  product,
  walletAddress,
  prefilledEmail,
  onClose,
  onOrder,
}: {
  product: Product
  walletAddress: string
  prefilledEmail?: string
  onClose: () => void
  onOrder: (orderId: string, paymentAddress: string, email: string) => void
}) {
  const [customValue, setCustomValue] = useState(product.range?.min ? String(product.range.min) : '')
  const [fixedInput, setFixedInput] = useState(product.denominations[0] ? String(product.denominations[0]) : '')
  const [email, setEmail] = useState(prefilledEmail ?? '')
  const [isPrefilled, setIsPrefilled] = useState(Boolean(prefilledEmail))
  const [activeTab, setActiveTab] = useState<'order' | 'details'>('order')
  const [loading, setLoading] = useState(false)
  const [balancesLoading, setBalancesLoading] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUsdbtModal, setShowUsdbtModal] = useState(false)

  const currency = 'USDC'
  const feeRate = 0.04
  const sortedDenominations = useMemo(
    () => [...product.denominations].filter((n) => Number.isFinite(n)).sort((a, b) => a - b),
    [product.denominations],
  )

  const selectedValue = product.range ? parseFloat(customValue) || 0 : parseFloat(fixedInput) || 0
  const fee = parseFloat((selectedValue * feeRate).toFixed(2))
  const total = parseFloat((selectedValue + fee).toFixed(2))
  const inRange = product.range ? selectedValue >= product.range.min && selectedValue <= product.range.max : true
  const emailValid = email.includes('@')
  const fixedValid = product.range ? true : sortedDenominations.includes(selectedValue)
  const hasEnoughBalance = usdcBalance === null ? true : usdcBalance >= total

  const valid = selectedValue > 0 && emailValid && inRange && fixedValid && hasEnoughBalance

  useEffect(() => {
    let cancelled = false
    async function loadBalances() {
      if (!walletAddress) return
      setBalancesLoading(true)
      try {
        const data = await getWalletBalances(walletAddress)
        if (!cancelled) setUsdcBalance(Number(data.usdc))
      } catch {
        if (!cancelled) setUsdcBalance(null)
      } finally {
        if (!cancelled) setBalancesLoading(false)
      }
    }
    loadBalances()
    return () => { cancelled = true }
  }, [walletAddress])

  function stepFixed(dir: 1 | -1) {
    if (sortedDenominations.length === 0) return
    const current = parseFloat(fixedInput) || sortedDenominations[0]
    const idx = sortedDenominations.findIndex(d => d === current)
    const fallback = idx >= 0 ? idx : 0
    const next = sortedDenominations[Math.max(0, Math.min(sortedDenominations.length - 1, fallback + dir))]
    setFixedInput(String(next))
  }

  function stepVariable(dir: 1 | -1) {
    if (!product.range) return
    const step = product.range.step || 1
    const next = Math.max(product.range.min, Math.min(product.range.max,
      (parseFloat(customValue) || product.range.min) + step * dir,
    ))
    setCustomValue(String(Number(next.toFixed(2))))
  }

  async function submit() {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      const order = await createOrder({ productId: product.id, value: selectedValue, email, walletAddress, currency })
      onOrder(order.orderId, order.paymentAddress, email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const DETAILS = [
    { icon: Tag,        label: 'Type',     value: titleize(product.type || 'gift_card') },
    { icon: FolderOpen, label: 'Category', value: titleize(product.categories?.[0] || 'gift_card') },
    { icon: Globe,      label: 'Country',  value: product.country || '—' },
    { icon: DollarSign, label: 'Currency', value: product.currency || '—' },
    { icon: Zap,        label: 'Delivery', value: 'Email · Instant' },
    { icon: ShieldCheck,label: 'KYC',      value: 'None required' },
  ]

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-[--color-brand-light] flex items-center justify-center overflow-hidden flex-shrink-0">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt="" className="w-full h-full object-contain p-1"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <span className="text-[--color-brand] font-bold text-lg">{product.name[0]}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
            <X size={15} />
          </button>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 leading-tight">{product.name}</h2>
        <p className="text-xs text-gray-400 mt-0.5">Gift Card · {priceLabel(product)}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-5 flex-shrink-0">
        {(['order', 'details'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 mr-5 text-[13px] font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-[--color-brand] border-[--color-brand]'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'order' ? (
          <div className="px-5 py-5 space-y-5">
            {/* Amount */}
            <div>
              <SectionLabel icon={DollarSign} text="Amount" />
              {product.denominations.length > 0 ? (
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => stepFixed(-1)}
                    className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={fixedInput}
                    onChange={(e) => setFixedInput(e.target.value)}
                    className="flex-1 h-12 px-3 text-center text-base font-semibold border-2 border-gray-200 rounded-xl outline-none focus:border-[--color-brand] bg-gray-50 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => stepFixed(1)}
                    className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : product.range ? (
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => stepVariable(-1)}
                    className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                    <input
                      type="number"
                      min={product.range.min}
                      max={product.range.max}
                      step={product.range.step}
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      placeholder={String(product.range.min)}
                      className="w-full h-12 pl-7 pr-3 text-center text-base font-semibold border-2 border-gray-200 rounded-xl outline-none focus:border-[--color-brand] bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => stepVariable(1)}
                    className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : null}
              {product.range && !inRange && selectedValue > 0 && (
                <p className="text-xs text-red-500 mt-2">
                  Amount must be ${product.range.min}–${product.range.max}
                </p>
              )}
              {!product.range && !fixedValid && selectedValue > 0 && (
                <p className="text-xs text-red-500 mt-2">Not a valid denomination for this card.</p>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* Pay with */}
            <div>
              <SectionLabel icon={CreditCard} text="Pay with" />
              <div className="space-y-2">
                <button className="flex items-center gap-2.5 border-2 border-[--color-brand] rounded-xl px-4 py-2.5 bg-[--color-brand-light] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/usdc_logo.png" alt="USDC" className="w-5 h-5 rounded-full object-contain flex-shrink-0" />
                  <span className="text-sm font-semibold text-[--color-brand]">USDC</span>
                  <Check size={14} className="text-[--color-brand] ml-auto" />
                </button>
                {/* USDBT — coming soon */}
                <button
                  type="button"
                  onClick={() => setShowUsdbtModal(true)}
                  className="relative w-full"
                >
                  <div className="flex items-center gap-2.5 border-2 border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 w-full blur-[2px] select-none">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2b2bf5' }}>
                      <span className="text-white text-[9px] font-bold">$</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">$USDBT</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-gray-500 bg-white/90 px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
                      Coming soon
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Email */}
            <div>
              <SectionLabel icon={Mail} text="Delivery email" />
              {isPrefilled && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Prefilled</span>
                  <button
                    type="button"
                    onClick={() => { setIsPrefilled(false); setEmail('') }}
                    className="text-[11px] text-gray-500 underline hover:text-gray-700"
                  >
                    Use another email
                  </button>
                </div>
              )}
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[--color-brand] bg-gray-50 focus:bg-white transition-colors"
              />
              {!emailValid && email.length > 0 && (
                <p className="text-xs text-red-500 mt-2">Enter a valid email address.</p>
              )}
            </div>

            {/* Fee breakdown */}
            {selectedValue > 0 && (
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Card value</span><span>${selectedValue}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Service fee (4%)</span><span>${fee}</span>
                </div>
                <div className="border-t border-gray-100 pt-2.5 flex justify-between text-sm font-semibold text-gray-800">
                  <span>You send</span><span>${total} USDC</span>
                </div>
                <div className={`text-xs ${hasEnoughBalance ? 'text-emerald-600' : 'text-red-500'}`}>
                  {balancesLoading
                    ? 'Checking wallet balance…'
                    : usdcBalance === null
                      ? 'Could not verify wallet balance right now.'
                      : hasEnoughBalance
                        ? `Balance OK: ${usdcBalance.toFixed(2)} USDC available`
                        : `Insufficient: ${usdcBalance.toFixed(2)} USDC available`}
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
        ) : (
          <div className="px-5 py-5 space-y-3">
            {DETAILS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2 text-gray-400">
                  <Icon size={13} />
                  <span className="text-sm">{label}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {activeTab === 'order' && (
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={submit}
            disabled={!valid || loading}
            className="w-full py-3 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2" style={{ backgroundColor: '#2b2bf5' }}
          >
            {loading && <span className="loading-bar-spinner" aria-hidden="true" />}
            {loading ? 'Creating order…' : 'Continue to payment'}
          </button>
        </div>
      )}

      {/* USDBT info modal */}
      <AnimatePresence>
        {showUsdbtModal && (
          <>
            <motion.div
              className="absolute inset-0 z-20 bg-black/30 rounded-[inherit]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setShowUsdbtModal(false)}
            />
            <motion.div
              className="absolute inset-x-4 z-30 bg-white rounded-2xl shadow-xl p-6"
              style={{ top: '50%', translateY: '-50%' }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#eef0ff' }}>
                  <span className="text-lg font-bold" style={{ color: '#2b2bf5' }}>$</span>
                </div>
                <button onClick={() => setShowUsdbtModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <X size={15} />
                </button>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Pay with $USDBT</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Soon you'll be able to make purchases directly with <span className="font-semibold text-gray-700">$USDBT</span> on Base — no swaps, no extra steps.
              </p>
              <p className="text-xs text-gray-400 mt-3">Hold $USDBT to unlock this feature when it launches.</p>
              <button
                onClick={() => setShowUsdbtModal(false)}
                className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: '#2b2bf5' }}
              >
                Got it
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
