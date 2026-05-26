'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  ScrollText, Bookmark, Users, Grid2X2,
  Copy, Check, Gift, Gamepad2, Tv, Plane, Utensils, ShoppingCart, Store,
} from 'lucide-react'
import { Sidebar, type View } from '@/components/Sidebar'
import { Header, type Tab } from '@/components/Header'
import { CardCatalog } from '@/components/CardCatalog'
import { OrderForm } from '@/components/OrderForm'
import { PaymentScreen } from '@/components/PaymentScreen'
import { SuccessScreen } from '@/components/SuccessScreen'
import { SplashScreen } from '@/components/SplashScreen'
import { CommandSearch } from '@/components/CommandSearch'
import { fetchProducts, type Product } from '@/lib/api'

type Step = 'catalog' | 'configure' | 'payment' | 'success'

const CATEGORIES = [
  { label: 'Gift Cards',  icon: Gift,        count: '200+' },
  { label: 'Gaming',      icon: Gamepad2,    count: '40+' },
  { label: 'Streaming',   icon: Tv,          count: '15+' },
  { label: 'Travel',      icon: Plane,       count: '12+' },
  { label: 'Food',        icon: Utensils,    count: '20+' },
  { label: 'Shopping',    icon: ShoppingCart,count: '30+' },
]

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

function CategoriesView({ onNavigate }: { onNavigate: (v: View) => void }) {
  return (
    <div className="px-5 py-5">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map(({ label, icon: Icon, count }) => (
            <button
              key={label}
              onClick={() => onNavigate('shop')}
              className="flex flex-col items-start p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all bg-white text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: '#eef0ff' }}>
                <Icon size={18} style={{ color: '#2b2bf5' }} />
              </div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{count} cards</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { isConnected, address } = useAccount()
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
  const [allProducts, setAllProducts] = useState<Product[]>([])

  useEffect(() => {
    fetchProducts().then(setAllProducts).catch(() => {})
  }, [])

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

  function handleNavigate(v: View) {
    setView(v)
    reset()
    setSearch('')
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

      <div className="flex h-screen overflow-hidden bg-[--color-surface]">
        <Sidebar
          active={view}
          onNavigate={handleNavigate}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header
            search={search}
            onSearch={setSearch}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onHamburgerClick={() => setMobileMenuOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
          />

          <div className="flex flex-1 overflow-hidden">
            {/* Main content */}
            <main className="flex-1 overflow-y-auto min-w-0">
              {!isConnected ? (
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
                <div className="p-4 md:p-5">
                  <CardCatalog
                    search={search}
                    selectedProduct={product}
                    onSelect={(p) => { setProduct(p); setStep('configure') }}
                  />
                </div>
              ) : view === 'orders' ? (
                <EmptyState
                  icon={ScrollText}
                  title="No orders yet"
                  sub="Once you make a purchase, your orders will appear here. Cards are delivered instantly to your email."
                />
              ) : view === 'saved' ? (
                <EmptyState
                  icon={Bookmark}
                  title="No saved cards"
                  sub="Save your favorite gift cards for quick access. Tap the bookmark icon on any card."
                />
              ) : view === 'refer' ? (
                <ReferView />
              ) : view === 'categories' ? (
                <CategoriesView onNavigate={handleNavigate} />
              ) : null}
            </main>

            {/* Right panel — order flow */}
            {showPanel && (
              <aside className={[
                'flex-shrink-0 border-l border-gray-100 overflow-hidden flex flex-col bg-white',
                'fixed inset-0 z-50 md:relative md:inset-auto md:z-auto md:w-[280px]',
              ].join(' ')}>
                {step === 'configure' && product && (
                  <OrderForm
                    product={product}
                    walletAddress={address!}
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
                  <SuccessScreen email={email} onReset={reset} />
                )}
              </aside>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
