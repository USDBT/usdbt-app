'use client'

import { useState } from 'react'
import { X, Check, Minus, Plus } from 'lucide-react'
import { createOrder, priceLabel, titleize, type Product } from '@/lib/api'

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
  const [value, setValue] = useState<number | null>(product.denominations[0] ?? product.range?.min ?? null)
  const [customValue, setCustomValue] = useState(product.range?.min ? String(product.range.min) : '')
  const [email, setEmail] = useState(prefilledEmail ?? '')
  const [isPrefilled, setIsPrefilled] = useState(Boolean(prefilledEmail))
  const [activeTab, setActiveTab] = useState<'order' | 'details'>('order')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currency = 'USDC'
  const feeRate = 0.04
  const selectedValue = product.range ? parseFloat(customValue) || 0 : value ?? 0
  const fee = parseFloat((selectedValue * feeRate).toFixed(2))
  const total = parseFloat((selectedValue + fee).toFixed(2))
  const inRange = product.range ? selectedValue >= product.range.min && selectedValue <= product.range.max : true
  const emailValid = email.includes('@')

  const valid =
    selectedValue > 0 &&
    emailValid &&
    inRange

  function updateVariableAmount(direction: 1 | -1) {
    if (!product.range) return
    const step = product.range.step || 1
    const next = Math.max(product.range.min, Math.min(product.range.max, (selectedValue || product.range.min) + (step * direction)))
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-[--color-brand-light] flex items-center justify-center overflow-hidden flex-shrink-0">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt="" className="w-full h-full object-contain p-1" />
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
      <div className="flex border-b border-gray-100 px-5">
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
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Amount</p>
              {product.denominations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.denominations.map((d) => (
                    <button
                      key={d}
                      onClick={() => setValue(d)}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        value === d
                          ? 'bg-[--color-brand] border-[--color-brand] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-[--color-brand]'
                      }`}
                    >
                      ${d}
                    </button>
                  ))}
                </div>
              ) : product.range ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateVariableAmount(-1)}
                    className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min={product.range.min}
                    max={product.range.max}
                    step={product.range.step}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder={`${product.range.min}–${product.range.max}`}
                    className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[--color-brand] bg-gray-50 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => updateVariableAmount(1)}
                    className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ) : null}
              {product.range && !inRange && (
                <p className="text-xs text-red-500 mt-2">
                  Amount must be between ${product.range.min} and ${product.range.max}.
                </p>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* Pay with */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Pay with</p>
              <button className="flex items-center gap-2.5 border-2 border-[--color-brand] rounded-xl px-4 py-2.5 bg-[--color-brand-light] w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/usdc_logo.png" alt="USDC" className="w-5 h-5 rounded-full object-contain flex-shrink-0" />
                <span className="text-sm font-semibold text-[--color-brand]">USDC</span>
                <Check size={14} className="text-[--color-brand] ml-auto" />
              </button>
            </div>

            <div className="border-t border-gray-100" />

            {/* Email */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Delivery email</p>
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
              {!emailValid && email.length > 0 && <p className="text-xs text-red-500 mt-2">Enter a valid email address.</p>}
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
              </div>
            )}

            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
        ) : (
          <div className="px-5 py-5 space-y-4">
            {[
              ['Type', titleize(product.type || 'gift_card')],
              ['Category', titleize(product.categories?.[0] || 'gift_card')],
              ['Country', product.country || '—'],
              ['Currency', product.currency || '—'],
              ['Delivery', 'Email · Instant'],
              ['KYC', 'None required'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium text-gray-700">{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {activeTab === 'order' && (
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={submit}
            disabled={!valid || loading}
            className="w-full py-3 bg-[--color-brand] hover:bg-[--color-brand-hover] text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <span className="loading-bar-spinner" aria-hidden="true" />}
            {loading ? 'Creating order…' : 'Continue to payment'}
          </button>
        </div>
      )}
    </div>
  )
}
