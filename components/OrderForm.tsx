'use client'

import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createOrder, type Product } from '@/lib/api'

const FEE = { USDC: 0.04, USDBT: 0.02 }

export function OrderForm({
  product,
  walletAddress,
  onBack,
  onOrder,
}: {
  product: Product
  walletAddress: string
  onBack: () => void
  onOrder: (orderId: string, paymentAddress: string, email: string) => void
}) {
  const [value, setValue] = useState<number | null>(
    product.denominations[0] ?? product.range?.min ?? null,
  )
  const [customValue, setCustomValue] = useState('')
  const [email, setEmail] = useState('')
  const [currency] = useState<'USDC' | 'USDBT'>('USDC')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedValue =
    product.range
      ? parseFloat(customValue) || 0
      : value ?? 0

  const feeRate = FEE[currency]
  const total = parseFloat((selectedValue * (1 + feeRate)).toFixed(2))
  const fee = parseFloat((selectedValue * feeRate).toFixed(2))

  const valid =
    selectedValue > 0 &&
    email.includes('@') &&
    (product.range
      ? selectedValue >= product.range.min && selectedValue <= product.range.max
      : true)

  async function submit() {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      const order = await createOrder({
        productId: product.id,
        value: selectedValue,
        email,
        walletAddress,
        currency,
      })
      onOrder(order.orderId, order.paymentAddress, email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-1">{product.name}</h1>
      <p className="text-gray-500 text-sm mb-6">Gift card · Delivered by email</p>

      {/* Denomination */}
      <div className="mb-5">
        <p className="text-sm font-medium mb-2">Amount</p>
        {product.denominations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {product.denominations.map((d) => (
              <button
                key={d}
                onClick={() => setValue(d)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  value === d
                    ? 'bg-[--color-brand] border-[--color-brand] text-white'
                    : 'border-[--color-surface-2] bg-[--color-surface] hover:border-[--color-brand] text-gray-700'
                }`}
              >
                ${d}
              </button>
            ))}
          </div>
        ) : product.range ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">$</span>
            <input
              type="number"
              min={product.range.min}
              max={product.range.max}
              step={product.range.step}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder={`${product.range.min}–${product.range.max}`}
              className="w-32 px-3 py-2 text-sm border border-[--color-surface-2] rounded-lg outline-none focus:border-[--color-brand] transition-colors"
            />
          </div>
        ) : null}
      </div>

      {/* Email */}
      <div className="mb-5">
        <label className="text-sm font-medium block mb-2">Delivery email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-[--color-surface-2] rounded-xl outline-none focus:border-[--color-brand] transition-colors bg-[--color-surface] focus:bg-white"
        />
      </div>

      {/* Fee breakdown */}
      {selectedValue > 0 && (
        <div className="bg-[--color-surface] rounded-xl p-4 mb-5 text-sm space-y-1.5">
          <div className="flex justify-between text-gray-500">
            <span>Card value</span>
            <span>${selectedValue}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Fee ({(feeRate * 100).toFixed(0)}%)</span>
            <span>${fee}</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-[--color-surface-2] pt-1.5 mt-1.5">
            <span>You send</span>
            <span>${total} {currency}</span>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        onClick={submit}
        disabled={!valid || loading}
        className="w-full py-3 rounded-xl bg-[--color-brand] text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[--color-brand-hover] transition-colors flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {loading ? 'Creating order…' : 'Continue to payment'}
      </button>
    </main>
  )
}
