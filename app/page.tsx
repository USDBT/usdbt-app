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
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { HelpDrawer } from '@/components/HelpDrawer'
import { EmailCaptureModal } from '@/components/EmailCaptureModal'
import { fetchProducts, getOrderProgress, type Product, type OrderProgress } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { getStoredEmail, storeEmail, authHeaders, clearToken, getValidToken } from '@/lib/auth'
import { getSavedCards, toggleSavedCard } from '@/lib/savedCards'

type Step = 'catalog' | 'configure' | 'payment' | 'success'

const CATEGORY_DEFS = [
  { label: 'Gift Cards',  icon: Gift,         keywords: [] as string[] },
  { label: 'Gaming',      icon: Gamepad2,     keywords: ['game', 'gaming', 'steam', 'xbox', 'playstation', 'nintendo', 'roblox', 'blizzard', 'battle'] },
  { label: 'Streaming',   icon: Tv,           keywords: ['netflix', 'hulu', 'disney', 'hbo', 'spotify', 'youtube', 'twitch', 'deezer', 'apple music', 'prime'] },
  { label: 'Travel',      icon: Plane,        keywords: ['airbnb', 'uber', 'expedia', 'booking', 'hotel', 'airline', 'flight', 'lyft'] },
  { label: 'Food',        icon: Utensils,     keywords: ['doordash', 'grubhub', 'starbucks', 'mcdonald', 'domino', 'pizza', 'dining', 'ubereats', 'seamless', 'chipotle'] },
  { label: 'Shopping',    icon: ShoppingCart, keywords: ['amazon', 'walmart', 'target', 'ebay', 'bestbuy', 'clothing', 'fashion', 'nordstrom', 'shein'] },
]

function countForCategory(label: string, keywords: string[], products: Product[]): number {
  if (label === 'Gift Cards') return products.length
  return products.filter((p) => {
    const haystack = [p.name, ...(p.categories ?? []), p.type ?? ''].join(' ').toLowerCase()
    return haystack.includes(label.toLowerCase()) || keywords.some((kw) => haystack.includes(kw))
  }).length
}

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
  onSubCategorySelect: (label: string) => void
  products: Product[]
}) {
  return (
    <div className="px-5 py-5">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORY_DEFS.map(({ label, icon: Icon, keywords }) => {
            const count = countForCategory(label, keywords, products)
            return (
              <button
                key={label}
                onClick={() => { onSubCategorySelect(label); onNavigate('shop') }}
                className="flex flex-col items-start p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all bg-white text-left"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: '#eef0ff' }}>
                  <Icon size={18} style={{ color: '#2b2bf5' }} />
                </div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{count > 0 ? `${count} cards` : '…'}</p>
              </button>
            )
          })}
        </div>
      </div>
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
          {savedCards.map((p) => (
            <div key={p.id} className="relative border border-gray-100 rounded-xl p-3.5 bg-white hover:border-gray-300 hover:shadow-sm transition-all flex flex-col">
              <button
                onClick={() => onToggleSave(p)}
                className="absolute top-2.5 right-2.5 p-1 rounded-md transition-colors z-10"
                aria-label="Unsave"
              >
                <Bookmark size={13} className="fill-[#2b2bf5] text-[#2b2bf5]" />
              </button>
              <button onClick={() => onSelect(p)} className="flex flex-col flex-1 text-left w-full">
                <div className="w-full h-20 rounded-xl mb-3 overflow-hidden bg-gray-50 flex items-center justify-center">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className="w-full h-full object-contain p-1.5"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <span className="text-2xl font-bold text-gray-300">{p.name[0]}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">{p.name}</p>
                <p className="text-xs text-gray-400 mt-1">{p.country || 'Global'}</p>
                <p className="text-xs text-gray-500 mt-auto pt-2">{
                  p.denominations.length > 0 ? `From $${Math.min(...p.denominations)}` : p.range ? `$${p.range.min}–$${p.range.max}` : 'Variable'
                }</p>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ActivityView({ connected, orderId, email }: { connected: boolean; orderId: string | null; email: string }) {
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 80)
    return () => clearTimeout(t)
  }, [])

  const activityRows = [
    connected ? 'Wallet connected' : 'Wallet not connected',
    email ? `Email saved: ${email}` : 'No email saved yet',
    orderId ? `Latest order created: ${orderId}` : 'No order created yet',
  ]
  const weeklyOrders = [1, 2, 1, 3, 2, 4, 3]
  const total = weeklyOrders.reduce((a, b) => a + b, 0)
  const statusData = [
    { label: 'Completed', value: 62, color: '#2b2bf5' },
    { label: 'Pending', value: 28, color: '#7c83ff' },
    { label: 'Failed', value: 10, color: '#b7bcff' },
  ]
  const statusTotal = statusData.reduce((acc, s) => acc + s.value, 0)
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
          {activityRows.map((row) => (
            <div key={row} className="px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-600">
              {row}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Orders (Last 7 Days)</h3>
          <span className="text-xs text-gray-400">{total} total</span>
        </div>
        <div className="flex items-end gap-2 h-32">
          {weeklyOrders.map((v, i) => {
            const pct = Math.max(12, (v / 4) * 100)
            return (
              <div key={`${v}-${i}`} className="flex-1 h-full flex flex-col items-center gap-1">
                <div className="w-full flex-1 bg-[#eef0ff] rounded-md overflow-hidden flex items-end">
                  <div
                    className="w-full rounded-md transition-all duration-700"
                    style={{ backgroundColor: '#2b2bf5', height: animate ? `${pct}%` : '0%' }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
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
                const segment = (item.value / statusTotal) * circumference
                const strokeDasharray = `${segment} ${circumference - segment}`
                const strokeDashoffset = -offsetCursor
                offsetCursor += segment
                return (
                  <circle
                    key={item.label}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="12"
                    strokeDasharray={animate ? strokeDasharray : `0 ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 800ms ease' }}
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-gray-500">100%</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {statusData.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.label}</span>
                </div>
                <span className="text-gray-500 font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SpendView({ orderId, paymentAddress }: { orderId: string | null; paymentAddress: string }) {
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 80)
    return () => clearTimeout(t)
  }, [])

  const spendData = [
    { label: 'Gift Cards', value: 76, color: '#2b2bf5' },
    { label: 'Fees', value: 18, color: '#7c83ff' },
    { label: 'Other', value: 6, color: '#b7bcff' },
  ]
  const total = spendData.reduce((acc, s) => acc + s.value, 0)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  let offsetCursor = 0

  return (
    <div className="px-5 py-5">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={16} className="text-[--color-brand]" />
          <h2 className="text-sm font-semibold text-gray-800">Current Spend Context</h2>
        </div>
        <div className="space-y-2.5">
          <div className="px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-600">
            {orderId ? `Open order: ${orderId}` : 'No active order in progress'}
          </div>
          <div className="px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-600 break-all">
            {paymentAddress ? `Payment address: ${paymentAddress}` : 'Payment address will appear after creating an order'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Spend Breakdown</h3>
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-5">
          <div className="mx-auto md:mx-0 relative w-[132px] h-[132px]">
            <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
              <circle cx="66" cy="66" r={radius} fill="none" stroke="#eef0ff" strokeWidth="14" />
              {spendData.map((item) => {
                const segment = (item.value / total) * circumference
                const strokeDasharray = `${segment} ${circumference - segment}`
                const strokeDashoffset = -offsetCursor
                offsetCursor += segment
                return (
                  <circle
                    key={item.label}
                    cx="66"
                    cy="66"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="14"
                    strokeDasharray={animate ? strokeDasharray : `0 ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 800ms ease' }}
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-semibold text-gray-800">{total}%</span>
              <span className="text-[11px] text-gray-400">allocated</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {spendData.map((item) => (
              <div key={`legend-${item.label}`} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.label}</span>
                </div>
                <span className="text-gray-500 font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {spendData.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{item.label}</span>
                <span>{item.value}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-700"
                  style={{ backgroundColor: item.color, width: animate ? `${item.value}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500">
          Animated placeholder metrics for now. Next step is wiring real spend totals from order history.
        </div>
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

  // After wallet connect: authenticate (SIWE → JWT), then check user registration.
  // Delayed by one tick so the wallet completes its own connection handshake first.
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
      // If we already have a cached email for this wallet, restore it and refresh token quietly
      const localEmail = getStoredEmail(address)
      if (localEmail) {
        setSavedEmail(localEmail)
        if (!getValidToken(address)) authenticate(address).catch(() => {})
        return
      }

      // New wallet — sign to get JWT, then check registration
      const token = await authenticate(address)
      if (!token) return  // user rejected signing — still let them browse

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

  function handleSubCategorySelect(label: string) {
    setCategoryFilter(label === 'Gift Cards' ? null : label)
  }

  function handleNavigate(v: View) {
    setView(v)
    reset()
    setSearch('')
    if (v !== 'shop') setCategoryFilter(null)
  }

  function handleTabChange(tab: Tab) {
    if (tab === 'support') {
      setHelpOpen(true)
      return
    }
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
          active={view}
          onNavigate={handleNavigate}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          onSettingsClick={() => setSettingsOpen(true)}
          onHelpClick={() => setHelpOpen(true)}
          onSubCategorySelect={handleSubCategorySelect}
        />

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header
            search={search}
            onSearch={setSearch}
            activeTab={activeTab}
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
                activeTab === 'cards' ? (
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
                ) : activeTab === 'activity' ? (
                  <ActivityView connected={isConnected} orderId={orderId} email={savedEmail || email} />
                ) : activeTab === 'spend' ? (
                  <SpendView orderId={orderId} paymentAddress={paymentAddress} />
                ) : (
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
                )
              ) : view === 'orders' ? (
                <OrdersView orderId={orderId} />
              ) : view === 'saved' ? (
                <SavedView
                  savedCards={savedCards}
                  onSelect={(p) => { setProduct(p); setStep('configure'); setView('shop') }}
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
