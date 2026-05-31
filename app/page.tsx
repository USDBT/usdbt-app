'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  ScrollText, Bookmark, Users, Grid2X2,
  Copy, Check, Gift, Gamepad2, Tv, Plane, Utensils, ShoppingCart, Store, Activity, DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'
import { Sidebar, type View } from '@/components/Sidebar'
import { Header, type Tab } from '@/components/Header'
import { CardCatalog } from '@/components/CardCatalog'
import { OrderForm } from '@/components/OrderForm'
import { PaymentScreen } from '@/components/PaymentScreen'
import { SuccessScreen } from '@/components/SuccessScreen'
import { SplashScreen } from '@/components/SplashScreen'
import { CommandSearch } from '@/components/CommandSearch'
import { VirtualCard } from '@/components/VirtualCard'
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { HelpDrawer } from '@/components/HelpDrawer'
import { EmailCaptureModal } from '@/components/EmailCaptureModal'
import { fetchProducts, getOrderProgress, getOrderStats, getWalletBalances, type Product, type OrderProgress, type OrderStats } from '@/lib/api'
import { deriveCategories } from '@/lib/categories'
import { useAuth } from '@/hooks/useAuth'
import { getStoredEmail, storeEmail, clearToken, getValidToken, authHeaders } from '@/lib/auth'
import { getSavedCards, toggleSavedCard } from '@/lib/savedCards'

type Step = 'catalog' | 'configure' | 'payment' | 'success'


function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-20">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
      <p className="text-xs text-gray-400 max-w-xs leading-relaxed">{sub}</p>
    </div>
  )
}

function ReferView() {
  const [copied, setCopied] = useState(false)
  const link = 'https://usdbt.us/ref/you'

  function copy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#eef0ff' }}>
          <Users size={22} style={{ color: '#2b2bf5' }} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Refer & Earn</h2>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Share your referral link. When a friend makes their first purchase, you both get a bonus.
        </p>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 mb-4">
          <span className="text-sm text-gray-600 flex-1 font-mono truncate">{link}</span>
          <button
            onClick={copy}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 flex-shrink-0"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center">Referral program launching soon.</p>
      </div>
    </div>
  )
}

function CategoriesView({
  onNavigate,
  onSubCategorySelect,
  products,
}: {
  onNavigate: (v: View) => void
  onSubCategorySelect: (slug: string | null) => void
  products: Product[]
}) {
  const categories = deriveCategories(products)

  return (
    <div className="px-5 py-5">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Browse by Category</h2>
        {categories.length === 0 ? (
          <p className="text-xs text-gray-400">Loading categories…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* All */}
            <button
              onClick={() => { onSubCategorySelect(null); onNavigate('shop') }}
              className="flex flex-col items-start p-4 rounded-xl border border-[rgba(43,43,245,0.3)] bg-white shadow-[inset_5px_5px_12px_rgba(43,43,245,0.18),inset_-5px_-5px_12px_rgba(43,43,245,0.18)] hover:border-[rgba(43,43,245,0.6)] hover:shadow-[inset_7px_7px_18px_rgba(43,43,245,0.32),inset_-7px_-7px_18px_rgba(43,43,245,0.32)] transition-all text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: '#eef0ff' }}>
                <Grid2X2 size={18} style={{ color: '#2b2bf5' }} />
              </div>
              <p className="text-sm font-medium text-gray-800">All Cards</p>
              <p className="text-xs text-gray-400 mt-0.5">{products.length} cards</p>
            </button>
            {categories.map(({ slug, label, icon: Icon, count }) => (
              <button
                key={slug}
                onClick={() => { onSubCategorySelect(slug); onNavigate('shop') }}
                className="flex flex-col items-start p-4 rounded-xl border border-[rgba(43,43,245,0.3)] bg-white shadow-[inset_5px_5px_12px_rgba(43,43,245,0.18),inset_-5px_-5px_12px_rgba(43,43,245,0.18)] hover:border-[rgba(43,43,245,0.6)] hover:shadow-[inset_7px_7px_18px_rgba(43,43,245,0.32),inset_-7px_-7px_18px_rgba(43,43,245,0.32)] transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: '#eef0ff' }}>
                  <Icon size={18} style={{ color: '#2b2bf5' }} />
                </div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{count} cards</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SavedCard({ product: p, index, onSelect, onToggleSave }: {
  product: Product; index: number; onSelect: (p: Product) => void; onToggleSave: (p: Product) => void
}) {
  const [shineKey, setShineKey] = useState(0)
  return (
    <div
      className="relative border border-[rgba(43,43,245,0.3)] rounded-xl p-3.5 bg-white shadow-[inset_5px_5px_12px_rgba(43,43,245,0.18),inset_-5px_-5px_12px_rgba(43,43,245,0.18)] hover:border-[rgba(43,43,245,0.6)] hover:shadow-[inset_7px_7px_18px_rgba(43,43,245,0.32),inset_-7px_-7px_18px_rgba(43,43,245,0.32)] transition-all flex flex-col overflow-hidden"
      onMouseEnter={() => setShineKey(k => k + 1)}
    >
      <div key={shineKey} className="card-shine-sweep" style={{ '--shine-delay': shineKey === 0 ? `${index * 60}ms` : '0ms' } as React.CSSProperties} />
      <button onClick={() => onToggleSave(p)} className="absolute top-2.5 right-2.5 p-1 rounded-md transition-colors z-30" aria-label="Unsave">
        <Bookmark size={13} className="fill-[#2b2bf5] text-[#2b2bf5]" />
      </button>
      <button onClick={() => onSelect(p)} className="flex flex-col flex-1 text-left w-full relative z-10">
        <div className="w-full h-20 rounded-xl mb-3 overflow-hidden bg-gray-50 flex items-center justify-center">
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image} alt={p.name} className="w-full h-full object-contain p-1.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <span className="text-2xl font-bold text-gray-300">{p.name[0]}</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">{p.name}</p>
        <p className="text-xs text-gray-400 mt-1">{p.country || 'Global'}</p>
        <p className="text-xs text-gray-500 mt-auto pt-2">{p.denominations.length > 0 ? `From $${Math.min(...p.denominations)}` : p.range ? `$${p.range.min}–$${p.range.max}` : 'Variable'}</p>
      </button>
    </div>
  )
}

function SavedView({
  savedCards,
  onSelect,
  onToggleSave,
}: {
  savedCards: Product[]
  onSelect: (p: Product) => void
  onToggleSave: (p: Product) => void
}) {
  if (savedCards.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="No saved cards"
        sub="Save your favorite gift cards for quick access. Tap the bookmark icon on any card."
      />
    )
  }

  return (
    <div className="px-5 py-5">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Saved Cards</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {savedCards.map((p, i) => (
            <SavedCard key={p.id} product={p} index={i} onSelect={onSelect} onToggleSave={onToggleSave} />
          ))}
        </div>
      </div>
    </div>
  )
}

function useStats(address?: string) {
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!address) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    getOrderStats(address, authHeaders(address))
      .then((s) => { if (!cancelled) setStats(s) })
      .catch(() => { if (!cancelled) setStats(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [address])
  return { stats, loading }
}

function statusLabel(s: string): string {
  if (s === 'delivered') return 'Delivered'
  if (s === 'failed') return 'Failed'
  if (s === 'refunded') return 'Refunded'
  if (s === 'pending_payment') return 'Awaiting payment'
  return 'Processing'
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function ActivityView({ address }: { address?: string }) {
  const { stats, loading } = useStats(address)
  const [animate, setAnimate] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimate(true), 80); return () => clearTimeout(t) }, [stats])

  if (loading) {
    return <div className="flex items-center justify-center h-full min-h-[40vh]"><div className="w-8 h-8 rounded-full border-2 border-[#2b2bf5] border-t-transparent animate-spin" /></div>
  }
  if (!stats || stats.totalOrders === 0) {
    return (
      <EmptyState icon={Activity} title="No activity yet" sub="Your orders and activity will appear here once you make your first purchase." />
    )
  }

  const maxDay = Math.max(1, ...stats.ordersByDay.map((d) => d.count))
  const weekTotal = stats.ordersByDay.reduce((a, d) => a + d.count, 0)
  const mix = stats.statusMix
  const mixTotal = Math.max(1, mix.completed + mix.pending + mix.failed)
  const statusData = [
    { label: 'Completed', value: mix.completed, color: '#2b2bf5' },
    { label: 'Pending', value: mix.pending, color: '#7c83ff' },
    { label: 'Failed', value: mix.failed, color: '#b7bcff' },
  ]
  const radius = 46
  const circumference = 2 * Math.PI * radius
  let offsetCursor = 0

  return (
    <div className="px-5 py-5">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-[--color-brand]" />
          <h2 className="text-sm font-semibold text-gray-800">Recent Activity</h2>
        </div>
        <div className="space-y-2.5">
          {stats.recentOrders.map((o) => (
            <div key={o.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50">
              <div>
                <p className="text-sm text-gray-700">{o.brandName} · ${o.faceValue}</p>
                <p className="text-[11px] text-gray-400">{statusLabel(o.status)} · {timeAgo(o.createdAt)}</p>
              </div>
              <span className="text-xs font-medium text-gray-500">${o.coinAmount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Orders (Last 7 Days)</h3>
          <span className="text-xs text-gray-400">{weekTotal} total</span>
        </div>
        <div className="flex items-end gap-2 h-32">
          {stats.ordersByDay.map((d, i) => {
            const pct = d.count === 0 ? 4 : Math.max(12, (d.count / maxDay) * 100)
            return (
              <div key={i} className="flex-1 h-full flex flex-col items-center gap-1">
                <div className="w-full flex-1 bg-[#eef0ff] rounded-md overflow-hidden flex items-end">
                  <div className="w-full rounded-md transition-all duration-700" style={{ backgroundColor: '#2b2bf5', height: animate ? `${pct}%` : '0%' }} />
                </div>
                <span className="text-[10px] text-gray-400">{d.label[0]}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Order Status Mix</h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative w-[120px] h-[120px] mx-auto sm:mx-0">
            <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="#eef0ff" strokeWidth="12" />
              {statusData.map((item) => {
                const segment = (item.value / mixTotal) * circumference
                const strokeDasharray = `${segment} ${circumference - segment}`
                const strokeDashoffset = -offsetCursor
                offsetCursor += segment
                return (
                  <circle key={item.label} cx="60" cy="60" r={radius} fill="none" stroke={item.color} strokeWidth="12"
                    strokeDasharray={animate ? strokeDasharray : `0 ${circumference}`} strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round" style={{ transition: 'stroke-dasharray 800ms ease' }} />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-700">{stats.totalOrders}</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {statusData.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.label}</span>
                </div>
                <span className="text-gray-500 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const SPEND_COLORS = ['#2b2bf5', '#5a5af8', '#7c83ff', '#a3a8ff', '#c4c8ff']

function SpendView({ address }: { address?: string }) {
  const { stats, loading } = useStats(address)
  const [animate, setAnimate] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimate(true), 80); return () => clearTimeout(t) }, [stats])

  if (loading) {
    return <div className="flex items-center justify-center h-full min-h-[40vh]"><div className="w-8 h-8 rounded-full border-2 border-[#2b2bf5] border-t-transparent animate-spin" /></div>
  }
  if (!stats || stats.totalOrders === 0) {
    return <EmptyState icon={DollarSign} title="No spend yet" sub="Once you buy your first card, your spend breakdown will show up here." />
  }

  const completed = stats.statusMix.completed
  const avg = completed > 0 ? stats.totalSpentUsdc / completed : 0
  const breakdown = stats.topBrands.map((b, i) => ({ ...b, color: SPEND_COLORS[i % SPEND_COLORS.length] }))
  const totalSpent = Math.max(0.01, stats.totalSpentUsdc)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  let offsetCursor = 0

  return (
    <div className="px-5 py-5">
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total spent', value: `$${stats.totalSpentUsdc.toFixed(2)}` },
          { label: 'Cards bought', value: String(completed) },
          { label: 'Avg / card', value: `$${avg.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-lg font-bold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Spend by Brand</h3>
        {breakdown.length === 0 ? (
          <p className="text-xs text-gray-400">No completed purchases yet.</p>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-5">
              <div className="mx-auto md:mx-0 relative w-[132px] h-[132px]">
                <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
                  <circle cx="66" cy="66" r={radius} fill="none" stroke="#eef0ff" strokeWidth="14" />
                  {breakdown.map((item) => {
                    const segment = (item.value / totalSpent) * circumference
                    const strokeDasharray = `${segment} ${circumference - segment}`
                    const strokeDashoffset = -offsetCursor
                    offsetCursor += segment
                    return (
                      <circle key={item.label} cx="66" cy="66" r={radius} fill="none" stroke={item.color} strokeWidth="14"
                        strokeDasharray={animate ? strokeDasharray : `0 ${circumference}`} strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round" style={{ transition: 'stroke-dasharray 800ms ease' }} />
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-semibold text-gray-800">${stats.totalSpentUsdc.toFixed(0)}</span>
                  <span className="text-[11px] text-gray-400">total</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {breakdown.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600 truncate max-w-[140px]">{item.label}</span>
                    </div>
                    <span className="text-gray-500 font-medium">${item.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {breakdown.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="truncate max-w-[160px]">{item.label}</span>
                    <span>{Math.round((item.value / totalSpent) * 100)}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-700" style={{ backgroundColor: item.color, width: animate ? `${(item.value / totalSpent) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function OrdersView({ orderId }: { orderId: string | null }) {
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(orderId)
  const [progress, setProgress] = useState<OrderProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const notifiedStatus = useRef<string | null>(null)

  useEffect(() => {
    if (orderId) {
      setCurrentOrderId(orderId)
      localStorage.setItem('latest_order_id', orderId)
      return
    }
    const saved = localStorage.getItem('latest_order_id')
    if (saved) setCurrentOrderId(saved)
  }, [orderId])

  useEffect(() => {
    if (!currentOrderId) return
    let active = true
    const run = async () => {
      try {
        const p = await getOrderProgress(currentOrderId)
        if (!active) return
        setProgress(p)
        setError(null)

        // Browser notification on terminal status change
        const status = p.status
        if (
          status !== notifiedStatus.current &&
          (status === 'delivered' || status === 'failed' || status === 'refunded') &&
          'Notification' in window &&
          Notification.permission === 'granted' &&
          localStorage.getItem('usdbt_notifs') !== 'false'
        ) {
          notifiedStatus.current = status
          const title = status === 'delivered' ? '🎉 Card delivered!' : status === 'refunded' ? 'Order refunded' : 'Order failed'
          const body  = status === 'delivered' ? 'Your gift card has been sent to your email.' : p.failureReason ?? 'Check your order for details.'
          new Notification(title, { body, icon: '/logo.png' })
        }
      } catch {
        if (!active) return
        setError('Could not load order progress.')
      }
    }
    run()
    const id = setInterval(run, 5000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [currentOrderId])

  if (!currentOrderId) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No orders yet"
        sub="Create your first card order and it will appear here with live progress."
      />
    )
  }

  const steps = ['Waiting for payment', 'Payment received', 'Funding provider wallet', 'Issuing your card']
  const currentStep = progress?.progress?.step ?? 1

  return (
    <div className="px-5 py-5">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Latest Order</h2>
          <span className="text-[11px] text-gray-400 font-mono">{currentOrderId}</span>
        </div>
        <div className="space-y-2">
          {steps.map((label, idx) => {
            const done = currentStep > idx + 1
            const current = currentStep === idx + 1 && !progress?.progress?.terminal
            return (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: done || current ? '#2b2bf5' : '#d1d5db' }}
                />
                <span className={`text-xs ${done || current ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-500 mt-4">
          {progress?.progress?.label ?? 'Tracking order progress…'}
        </p>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>
    </div>
  )
}

export default function Home() {
  const { isConnected, address, status } = useAccount()
  const { authenticate } = useAuth()
  const prevAddress = useRef<string | undefined>(undefined)
  const [splashDone, setSplashDone] = useState(false)
  const [view, setView] = useState<View>('shop')
  const [activeTab, setActiveTab] = useState<Tab>('cards')
  const [browsing, setBrowsing] = useState(false)
  const [cardBalance, setCardBalance] = useState<{ usdc: string } | null>(null)
  const [balanceOpen, setBalanceOpen] = useState(false)
  const [step, setStep] = useState<Step>('catalog')
  const [product, setProduct] = useState<Product | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentAddress, setPaymentAddress] = useState('')
  const [email, setEmail] = useState('')
  const [search, setSearch] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [savedEmail, setSavedEmail] = useState('')
  const [savedCards, setSavedCards] = useState<Product[]>(() => getSavedCards())
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts().then(setAllProducts).catch(() => {})
  }, [])

  // Fetch wallet balance for the virtual card
  useEffect(() => {
    if (!isConnected || !address) { setCardBalance(null); return }
    let cancelled = false
    getWalletBalances(address)
      .then((b) => { if (!cancelled) setCardBalance({ usdc: b.usdc }) })
      .catch(() => { if (!cancelled) setCardBalance(null) })
    return () => { cancelled = true }
  }, [isConnected, address])

  // After wallet connect: authenticate (SIWE → JWT), then check user registration
  useEffect(() => {
    if (!isConnected || !address) {
      if (prevAddress.current) clearToken(prevAddress.current)
      prevAddress.current = undefined
      setSavedEmail('')
      return
    }
    prevAddress.current = address

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''

    const t = setTimeout(async () => {
      const localEmail = getStoredEmail(address)
      if (localEmail) {
        setSavedEmail(localEmail)
        if (!getValidToken(address)) authenticate(address).catch(() => {})
        return
      }

      const token = await authenticate(address)
      if (!token) return

      try {
        const r = await fetch(`${backendUrl}/users/${address}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (r.status === 404) {
          setShowEmailModal(true)
        } else if (r.ok) {
          const u = await r.json()
          const email = u.email ?? ''
          setSavedEmail(email)
          storeEmail(email, address)
        }
      } catch {}
    }, 500)

    return () => clearTimeout(t)
  }, [isConnected, address])

  // Cmd+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(o => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function reset() {
    setStep('catalog')
    setProduct(null)
    setOrderId(null)
    setPaymentAddress('')
    setEmail('')
  }

  function handleToggleSave(p: Product) {
    const wasSaved = savedCards.some((c) => c.id === p.id)
    setSavedCards(toggleSavedCard(p))
    if (wasSaved) {
      toast.error(`Removed from saved`, { duration: 2000 })
    } else {
      toast.success(`Saved ${p.name}`, { duration: 2000 })
    }
  }

  function handleSubCategorySelect(slug: string | null) {
    setCategoryFilter(slug)
  }

  function handleNavigate(v: View) {
    setView(v)
    reset()
    setSearch('')
    if (v !== 'shop') setCategoryFilter(null)
    // Entering Shop (or its sub-categories) means the user wants to browse the catalog
    if (v === 'shop') { setBrowsing(true); setActiveTab('cards') }
  }

  function handleTabChange(tab: Tab) {
    if (tab === 'support') {
      setHelpOpen(true)
      return
    }
    // Header tabs live on the shop/card surface — switch back to it from any view
    setView('shop')
    setBrowsing(false)
    setActiveTab(tab)
  }

  const handleSplashDone = useCallback(() => setSplashDone(true), [])

  const showPanel = step !== 'catalog'

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}

      <CommandSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={allProducts}
        onSelectProduct={(p) => {
          setProduct(p)
          setStep('configure')
          setView('shop')
          setBrowsing(true)
        }}
      />

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
      {showEmailModal && address && (
        <EmailCaptureModal
          walletAddress={address}
          onSaved={(email) => { setSavedEmail(email); setShowEmailModal(false) }}
          onDismiss={() => setShowEmailModal(false)}
        />
      )}

      <div className="flex h-screen overflow-hidden bg-[--color-surface]">
        <Sidebar
          active={view === 'shop' && !browsing ? null : view}
          onNavigate={handleNavigate}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          onSettingsClick={() => setSettingsOpen(true)}
          onHelpClick={() => setHelpOpen(true)}
          onSubCategorySelect={handleSubCategorySelect}
          categories={deriveCategories(allProducts)}
          balanceOpen={balanceOpen}
          onBalanceOpenChange={setBalanceOpen}
        />

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header
            search={search}
            onSearch={setSearch}
            activeTab={view === 'shop' && !browsing ? activeTab : null}
            onTabChange={handleTabChange}
            onHamburgerClick={() => setMobileMenuOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
          />

          <div className="flex flex-1 overflow-hidden">
            {/* Main content */}
            <main className="flex-1 overflow-y-auto min-w-0">
              {status === 'reconnecting' ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 rounded-full border-2 border-[#2b2bf5] border-t-transparent animate-spin" />
                </div>
              ) : !isConnected ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: '#eef0ff' }}>
                    <Store size={26} style={{ color: '#2b2bf5' }} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Connect your wallet</h2>
                  <p className="text-gray-400 text-xs max-w-xs leading-relaxed mb-6">
                    200+ gift cards from top brands. Pay with USDC or $USDBT on Base.
                    No KYC, no banks, delivered to your inbox.
                  </p>
                  <ConnectButton />
                  <p className="text-[11px] text-gray-300 mt-4">No KYC · On Base · Instant delivery</p>
                </div>
              ) : view === 'shop' ? (
                browsing ? (
                  <div className="p-4 md:p-5">
                    <CardCatalog
                      search={search}
                      selectedProduct={product}
                      onSelect={(p) => { setProduct(p); setStep('configure') }}
                      savedIds={new Set(savedCards.map((c) => c.id))}
                      onToggleSave={handleToggleSave}
                      categoryFilter={categoryFilter}
                    />
                  </div>
                ) : activeTab === 'cards' ? (
                  <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-full">
                    <VirtualCard
                      address={address}
                      balanceUsdc={cardBalance?.usdc}
                      onViewCatalog={() => { setBrowsing(true); setView('shop') }}
                      onViewOrders={() => handleNavigate('orders')}
                      onTopUp={() => setBalanceOpen(true)}
                    />
                  </div>
                ) : activeTab === 'activity' ? (
                  <ActivityView address={address} />
                ) : activeTab === 'spend' ? (
                  <SpendView address={address} />
                ) : (
                  <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-full">
                    <VirtualCard
                      address={address}
                      balanceUsdc={cardBalance?.usdc}
                      onViewCatalog={() => { setBrowsing(true); setView('shop') }}
                      onViewOrders={() => handleNavigate('orders')}
                      onTopUp={() => setBalanceOpen(true)}
                    />
                  </div>
                )
              ) : view === 'orders' ? (
                <OrdersView orderId={orderId} />
              ) : view === 'saved' ? (
                <SavedView
                  savedCards={savedCards}
                  onSelect={(p) => { setProduct(p); setStep('configure'); setView('shop'); setBrowsing(true) }}
                  onToggleSave={handleToggleSave}
                />
              ) : view === 'refer' ? (
                <ReferView />
              ) : view === 'categories' ? (
                <CategoriesView
                  onNavigate={handleNavigate}
                  onSubCategorySelect={handleSubCategorySelect}
                  products={allProducts}
                />
              ) : null}
            </main>

            {/* Order panel content (shared between desktop and mobile) */}
            {(() => {
              const panelContent = (
                <>
                  {step === 'configure' && product && (
                    <OrderForm
                      product={product}
                      walletAddress={address!}
                      prefilledEmail={savedEmail || undefined}
                      onClose={reset}
                      onOrder={(id, addr, mail) => {
                        setOrderId(id)
                        setPaymentAddress(addr)
                        setEmail(mail)
                        setStep('payment')
                      }}
                    />
                  )}
                  {step === 'payment' && orderId && (
                    <PaymentScreen
                      orderId={orderId}
                      paymentAddress={paymentAddress}
                      email={email}
                      onSuccess={() => setStep('success')}
                    />
                  )}
                  {step === 'success' && (
                    <SuccessScreen orderId={orderId!} email={email} onReset={reset} />
                  )}
                </>
              )

              return (
                <>
                  {/* Desktop: wipe in from right as flex child */}
                  <AnimatePresence>
                    {showPanel && (
                      <motion.aside
                        key="order-panel-desktop"
                        className="hidden md:flex flex-col bg-white overflow-hidden flex-shrink-0 border-l border-gray-100"
                        initial={{ width: 0 }}
                        animate={{ width: 400 }}
                        exit={{ width: 0 }}
                        transition={{ type: 'spring', damping: 32, stiffness: 280 }}
                      >
                        <div className="w-[400px] h-full flex flex-col overflow-hidden">
                          {panelContent}
                        </div>
                      </motion.aside>
                    )}
                  </AnimatePresence>

                  {/* Mobile: slide up from bottom */}
                  <AnimatePresence>
                    {showPanel && (
                      <>
                        <motion.div
                          key="order-backdrop-mobile"
                          className="md:hidden fixed inset-0 z-40 bg-black/30"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          onClick={reset}
                        />
                        <motion.aside
                          key="order-panel-mobile"
                          className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
                          initial={{ y: '100%' }}
                          animate={{ y: 0 }}
                          exit={{ y: '100%' }}
                          transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                        >
                          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 flex-shrink-0" />
                          {panelContent}
                        </motion.aside>
                      </>
                    )}
                  </AnimatePresence>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </>
  )
}
