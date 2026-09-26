'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  X, Check, Minus, Plus,
  DollarSign, CreditCard, Mail,
  Tag, FolderOpen, Globe, Zap, ShieldCheck,
  Sparkles, Gift, Layers, Bell, Shield,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  createOrder,
  fetchProductDetail,
  getWalletBalances,
  priceLabel,
  titleize,
  type OrderCreated,
  type PaymentCurrency,
  type PaymentChain,
  type Product,
  getLoyaltyStats,
  verifyReferralCode,
  createPriceAlert,
  type LoyaltyStats,
} from '@/lib/api'
import { formatAmount } from '@/lib/relay'
import { getSimSpent } from '@/lib/auth'
import { FEATURES } from '@/lib/features'

function SectionLabel({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <Icon size={12} className="text-gray-400" />
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{text}</p>
    </div>
  )
}

const CHAIN_OPTIONS: Array<{ id: PaymentChain; name: string; currencies: PaymentCurrency[] }> = [
  { id: 'robinhood', name: 'Robinhood', currencies: ['USDG', 'ETH'] },
  // Base, Ethereum and Solana are hidden until their payments settle end to end.
]

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
  onOrder: (order: OrderCreated, email: string) => void
}) {
  const [resolvedProduct, setResolvedProduct] = useState(product)
  const [coinAmounts, setCoinAmounts] = useState<Record<number, number>>({})
  const [detailLoading, setDetailLoading] = useState(product.denominations.length === 0 && !product.range)
  const [detailError, setDetailError] = useState(false)
  const [customValue, setCustomValue] = useState(product.range?.min ? String(product.range.min) : '')
  const [fixedInput, setFixedInput] = useState(product.denominations[0] ? String(product.denominations[0]) : '')
  const [email, setEmail] = useState(prefilledEmail ?? '')
  const [isPrefilled, setIsPrefilled] = useState(Boolean(prefilledEmail))
  const [activeTab, setActiveTab] = useState<'order' | 'details'>('order')
  const [loading, setLoading] = useState(false)
  const [balancesLoading, setBalancesLoading] = useState(false)

  // Multi-chain & Currency
  const [chain, setChain] = useState<PaymentChain>('robinhood')
  const [currency, setCurrency] = useState<PaymentCurrency>('USDG')
  const [balances, setBalances] = useState<{ USDG: number; ETH: number } | null>(null)

  // Bulk Buying
  const [quantity, setQuantity] = useState<number>(1)

  // Loyalty Points
  const [loyalty, setLoyalty] = useState<LoyaltyStats | null>(null)
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false)
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0)

  // Referral Program
  const [referralInput, setReferralInput] = useState('')
  const [appliedReferral, setAppliedReferral] = useState<string | null>(null)
  const [referralDiscountPct, setReferralDiscountPct] = useState<number>(0)
  const [referralError, setReferralError] = useState<string | null>(null)

  // NFT & Escrow Options
  const [isNft, setIsNft] = useState(false)
  const [isEscrow, setIsEscrow] = useState(false)

  // Price Alert Modal
  const [alertModalOpen, setAlertModalOpen] = useState(false)
  const [alertDiscountPct, setAlertDiscountPct] = useState('5')
  const [alertSaved, setAlertSaved] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [showUsdbtModal, setShowUsdbtModal] = useState(false)

  // Fetch real denominations from CR if not already loaded
  useEffect(() => {
    if (product.denominations.length > 0 || product.range) return
    let cancelled = false
    setDetailLoading(true)
    fetchProductDetail(product.id)
      .then((detail) => {
        if (cancelled) return
        if (detail.denominations.length === 0 && !detail.range) { setDetailError(true); return }
        const merged = { ...product, denominations: detail.denominations, range: detail.range }
        setResolvedProduct(merged)
        setCoinAmounts(detail.coinAmounts ?? {})
        if (detail.denominations.length > 0) setFixedInput(String(detail.denominations[0]))
        if (detail.range) setCustomValue(String(detail.range.min))
      })
      .catch(() => { if (!cancelled) setDetailError(true) })
      .finally(() => { if (!cancelled) setDetailLoading(false) })
    return () => { cancelled = true }
  }, [product])

  // Fetch user loyalty stats
  useEffect(() => {
    if (!walletAddress) return
    getLoyaltyStats(walletAddress)
      .then((l) => {
        setLoyalty(l)
        if (l.pointsBalance >= 100) {
          setPointsToRedeem(Math.min(l.pointsBalance, 500))
        }
      })
      .catch(() => {})
  }, [walletAddress])

  const p = resolvedProduct

  const sortedDenominations = useMemo(
    () => [...p.denominations].filter((n) => Number.isFinite(n)).sort((a, b) => a - b),
    [p.denominations],
  )

  const selectedValue = p.range ? parseFloat(customValue) || 0 : parseFloat(fixedInput) || 0
  const subtotal = selectedValue * quantity

  // Volume discounts
  const volumeDiscountPct = quantity >= 25 ? 6 : quantity >= 10 ? 4 : quantity >= 5 ? 2 : 0
  const volumeDiscount = (subtotal * volumeDiscountPct) / 100

  // Referral discount (2%)
  const referralDiscount = FEATURES.checkoutDiscounts && appliedReferral ? (subtotal * (referralDiscountPct / 100)) : 0

  // Loyalty discount (100 pts = $1, max 20% of subtotal)
  const maxLoyaltyDiscount = subtotal * 0.20
  const loyaltyDiscount = useLoyaltyPoints ? Math.min(pointsToRedeem / 100, maxLoyaltyDiscount) : 0

  const totalDiscount = volumeDiscount + referralDiscount + loyaltyDiscount
  const finalPrice = Math.max(1, parseFloat((subtotal - totalDiscount).toFixed(2)))

  const inRange = p.range ? selectedValue >= p.range.min && selectedValue <= p.range.max : true
  const emailValid = email.includes('@')
  const walletBalance = balances && currency === 'USDG' ? balances.USDG : null
  const hasEnoughBalance = chain !== 'robinhood' || currency !== 'USDG' || walletBalance === null ? true : walletBalance >= finalPrice

  const valid = !detailLoading && !detailError && selectedValue > 0 && emailValid && inRange && hasEnoughBalance

  // Balance loader
  useEffect(() => {
    let cancelled = false
    async function loadBalances() {
      if (!walletAddress) return
      setBalancesLoading(true)
      try {
        const data = await getWalletBalances(walletAddress)
        if (!cancelled) {
          const usdg = Number(data.usdg ?? 0)
          setBalances({
            USDG: data.simulated ? Math.max(0, usdg - getSimSpent(walletAddress)) : usdg,
            ETH: Number(data.eth ?? 0),
          })
        }
      } catch {
        if (!cancelled) setBalances(null)
      } finally {
        if (!cancelled) setBalancesLoading(false)
      }
    }
    loadBalances()
    return () => { cancelled = true }
  }, [walletAddress])

  // Sync available currencies when chain changes
  const handleChainChange = (newChain: PaymentChain) => {
    setChain(newChain)
    const opt = CHAIN_OPTIONS.find((c) => c.id === newChain)
    if (opt && !opt.currencies.includes(currency)) {
      setCurrency(opt.currencies[0])
    }
  }

  function stepVariable(dir: 1 | -1) {
    if (!p.range) return
    const step = p.range.step || 1
    const next = Math.max(p.range.min, Math.min(p.range.max,
      (parseFloat(customValue) || p.range.min) + step * dir,
    ))
    setCustomValue(String(Number(next.toFixed(2))))
  }

  async function handleApplyReferral() {
    setReferralError(null)
    if (!referralInput.trim()) return
    const res = await verifyReferralCode(referralInput.trim())
    if (res.valid) {
      setAppliedReferral(referralInput.trim().toUpperCase())
      setReferralDiscountPct(res.discountPct)
    } else {
      setReferralError('Invalid or expired referral code.')
    }
  }

  async function handleCreateAlert() {
    if (!email) {
      setError('Please provide an email for the price alert')
      return
    }
    try {
      await createPriceAlert({
        walletAddress,
        email,
        brandId: p.id,
        brandName: p.name,
        targetDiscountPct: Number(alertDiscountPct) || 5,
      })
      setAlertSaved(true)
      setTimeout(() => {
        setAlertSaved(false)
        setAlertModalOpen(false)
      }, 1500)
    } catch {
      setError('Could not save price alert')
    }
  }

  async function submit() {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      const isRange = !!p.range
      const order = await createOrder({
        brandName: p.name,
        familyName: p.id,
        countryCode: p.countryCode || 'US',
        denomination: isRange ? 'range' : String(selectedValue),
        productValue: isRange ? selectedValue : undefined,
        faceValue: selectedValue,
        email,
        walletAddress,
        paymentCurrency: currency,
        paymentChain: chain,
        quantity,
        loyaltyPointsUsed: FEATURES.checkoutDiscounts && useLoyaltyPoints ? pointsToRedeem : 0,
        referralCode: appliedReferral || undefined,
        isNft: FEATURES.nftCards && isNft,
        isEscrow: FEATURES.escrow && (isEscrow || finalPrice >= 250),
      })
      onOrder(order, email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const DETAILS = [
    { icon: Tag,         label: 'Type',     value: titleize(p.type || 'gift_card') },
    { icon: FolderOpen,  label: 'Category', value: titleize(p.categories?.[0] || 'gift_card') },
    { icon: Globe,       label: 'Country',  value: p.country || '—' },
    { icon: DollarSign,  label: 'Currency', value: p.currency || 'USD' },
    { icon: Zap,         label: 'Delivery', value: 'Email · Instant' },
    { icon: ShieldCheck, label: 'KYC',      value: 'None required (Tier 0 Zero-KYC)' },
  ]

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="relative overflow-hidden flex-shrink-0">
        {p.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'blur(2px)', transform: 'scale(1.1)' }}
          />
        )}
        <div className="absolute inset-0" style={{ backgroundColor: p.image ? 'rgba(20,20,60,0.62)' : '#2b2bf5' }} />
        <div
          className="absolute inset-x-0 bottom-0 h-10 z-[5] pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 70%, #fff 100%)' }}
        />
        <div className="relative z-10 px-5 pt-4 pb-5">
          <div className="flex justify-end mb-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
          <h2 className="text-lg font-bold text-white leading-tight" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
            {p.name}
          </h2>
          <p className="text-xs text-white/70 mt-0.5" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            Gift Card · {detailLoading ? 'Loading…' : priceLabel(p)}
          </p>
        </div>
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
          <div className="px-5 py-4 space-y-4">
            {/* Amount & Quantity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <SectionLabel icon={DollarSign} text="Card Value" />
                {/* Bulk Quantity Stepper */}
                {FEATURES.bulkOrders && (
                <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-6 h-6 flex items-center justify-center rounded bg-white text-gray-700 shadow-xs hover:bg-gray-50 text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-semibold px-1 font-mono">{quantity}x</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                    className="w-6 h-6 flex items-center justify-center rounded bg-white text-gray-700 shadow-xs hover:bg-gray-50 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
                )}
              </div>

              {p.denominations.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x" style={{ scrollbarWidth: 'none' }}>
                  {sortedDenominations.map((d) => {
                    const selected = parseFloat(fixedInput) === d
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFixedInput(String(d))}
                        className={`tile flex-shrink-0 snap-start flex flex-col items-center px-4 py-2.5 ${selected ? 'tile-selected text-[--color-brand]' : 'text-[--ink]'}`}
                      >
                        <span className="font-mono tabular text-sm font-semibold">${d}</span>
                      </button>
                    )
                  })}
                </div>
              ) : p.range ? (
                <div className="flex items-stretch gap-2">
                  <button type="button" onClick={() => stepVariable(-1)} aria-label="Decrease amount" className="btn btn-secondary btn-icon flex-shrink-0">
                    <Minus size={16} />
                  </button>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                    <input
                      type="number" min={p.range.min} max={p.range.max} step={p.range.step}
                      value={customValue} onChange={(e) => setCustomValue(e.target.value)}
                      placeholder={String(p.range.min)}
                      className="w-full h-12 pl-7 pr-3 text-center font-mono tabular text-base font-semibold border border-[--line] rounded-xl outline-none focus:border-[--color-brand] focus:ring-4 focus:ring-[rgba(43,43,245,0.12)] bg-white transition-colors"
                    />
                  </div>
                  <button type="button" onClick={() => stepVariable(1)} aria-label="Increase amount" className="btn btn-secondary btn-icon flex-shrink-0">
                    <Plus size={16} />
                  </button>
                </div>
              ) : null}

              {/* Volume discount notice */}
              {volumeDiscountPct > 0 && (
                <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5 border border-emerald-100">
                  <span className="flex items-center gap-1">
                    <Layers size={12} />
                    {volumeDiscountPct}% Volume Discount Applied ({quantity} cards)
                  </span>
                  <span>-${volumeDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* Multi-Chain & Token Selection */}
            <div>
              <SectionLabel icon={CreditCard} text="Pay with" />
              {/* Chain Tabs */}
              {CHAIN_OPTIONS.length > 1 && <div className="grid grid-cols-4 gap-1.5 bg-gray-100 p-1 rounded-xl mb-2.5">
                {CHAIN_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleChainChange(c.id)}
                    className={`py-1.5 text-[11px] font-medium rounded-lg transition-all text-center ${
                      chain === c.id
                        ? 'bg-white text-gray-900 shadow-xs font-semibold'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>}

              {/* Currencies for chosen chain */}
              <div className="grid grid-cols-2 gap-2">
                {CHAIN_OPTIONS.find((c) => c.id === chain)?.currencies.map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`tile flex flex-col items-center justify-center py-2 px-2 text-center ${
                      currency === curr ? 'tile-selected text-[--color-brand]' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-xs font-bold font-mono">{curr}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Robinhood Chain</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Loyalty Points Redemption */}
            {FEATURES.checkoutDiscounts && loyalty && loyalty.pointsBalance >= 50 && (
              <div className="bg-[#f6f7ff] rounded-xl p-3 border border-[#e4e7ff]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useLoyaltyPoints}
                      onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                      className="rounded text-[--color-brand] focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                      <Sparkles size={13} className="text-[#2b2bf5]" />
                      Redeem Loyalty Points
                    </span>
                  </label>
                  <span className="text-[11px] text-[#2b2bf5] font-mono font-medium">
                    {loyalty.pointsBalance} pts available
                  </span>
                </div>
                {useLoyaltyPoints && (
                  <div className="mt-2 pt-2 border-t border-[#e2e5ff] flex items-center justify-between text-xs text-gray-600">
                    <span>Redeeming {pointsToRedeem} pts</span>
                    <span className="font-semibold text-emerald-600">-${loyaltyDiscount.toFixed(2)} off</span>
                  </div>
                )}
              </div>
            )}

            {/* Referral Code Box */}
            <div>
              <SectionLabel icon={Gift} text="Referral Code" />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="REF-XXXXXX"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none uppercase font-mono bg-gray-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyReferral}
                  className="px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors"
                >
                  Apply
                </button>
              </div>
              {appliedReferral && (
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                  <Check size={11} /> Code {appliedReferral} applied. {FEATURES.checkoutDiscounts ? `2% discount (-$${referralDiscount.toFixed(2)})` : 'Your friend earns reward points when your card is delivered.'}
                </p>
              )}
              {referralError && (
                <p className="text-[11px] text-red-500 mt-1">{referralError}</p>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* Advanced Options: NFT Voucher & Escrow */}
            {(FEATURES.nftCards || FEATURES.escrow) && (<>
            <div className="space-y-2">
              {FEATURES.nftCards && <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={isNft}
                  onChange={(e) => setIsNft(e.target.checked)}
                  className="mt-0.5 rounded text-[--color-brand]"
                />
                <div>
                  <p className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                    Mint as NFT Gift Card
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full font-medium">Web3</span>
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                    Get an on-chain digital card token. Hold, transfer to friends, or unwrap code anytime.
                  </p>
                </div>
              </label>}

              {FEATURES.escrow && <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={isEscrow || finalPrice >= 250}
                  disabled={finalPrice >= 250}
                  onChange={(e) => setIsEscrow(e.target.checked)}
                  className="mt-0.5 rounded text-[--color-brand]"
                />
                <div>
                  <p className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                    <Shield size={12} className="text-emerald-600" />
                    Escrow Protection
                    {finalPrice >= 250 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full font-medium">Included ($250+)</span>}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                    Crypto locked in escrow until you confirm the code works or 24h expires.
                  </p>
                </div>
              </label>}
            </div>

            <div className="border-t border-gray-100" />
            </>)}

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
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[--color-brand] bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Price Summary */}
            {selectedValue > 0 && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Card value ({quantity}x ${selectedValue})</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discounts (Volume, Loyalty, Referral)</span>
                    <span>-${totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                  <span>You pay</span>
                  <span>${finalPrice.toFixed(2)} in {currency}</span>
                </div>
                <div className="text-[11px] text-gray-400">
                  Network: {chain.toUpperCase()} · Earns {Math.floor(finalPrice * 10)} loyalty points
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
        ) : (
          <div className="px-5 py-5 space-y-3">
            <button
              type="button"
              onClick={() => setAlertModalOpen(true)}
              className="w-full py-2.5 px-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors"
            >
              <Bell size={14} className="text-amber-600" />
              Set Price Drop / Promo Alert for {p.name}
            </button>

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
        <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-white">
          <button
            onClick={submit}
            disabled={!valid || loading}
            style={{ backgroundColor: '#2b2bf5', color: '#ffffff' }}
            className="w-full h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#2b2bf5] hover:bg-[#1f1fd8] shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading && <span className="loading-bar-spinner" aria-hidden="true" />}
            <span style={{ color: '#ffffff' }}>
              {loading ? 'Creating order…' : `Pay $${finalPrice.toFixed(2)} on ${chain.toUpperCase()}`}
            </span>
          </button>
        </div>
      )}

      {/* Price Alert Modal */}
      <AnimatePresence>
        {alertModalOpen && (
          <>
            <motion.div
              className="absolute inset-0 z-20 bg-black/30 rounded-[inherit]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAlertModalOpen(false)}
            />
            <motion.div
              className="absolute inset-x-4 z-30 bg-white rounded-2xl shadow-xl p-5"
              style={{ top: '50%', translateY: '-50%' }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Bell size={16} className="text-amber-500" />
                  Price Alert: {p.name}
                </h3>
                <button onClick={() => setAlertModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                We'll email you immediately whenever {p.name} has a promotion or discount.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">Target Discount</label>
                  <select
                    value={alertDiscountPct}
                    onChange={(e) => setAlertDiscountPct(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <option value="3">Any promotion (3%+ off)</option>
                    <option value="5">Good discount (5%+ off)</option>
                    <option value="10">Big discount (10%+ off)</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleCreateAlert}
                  className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
                >
                  {alertSaved ? 'Alert Active! ✓' : 'Save Price Alert'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
