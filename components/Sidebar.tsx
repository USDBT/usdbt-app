'use client'

import Image from 'next/image'
import {
  ShoppingBag, ScrollText, Bookmark, Users, Grid2X2, LayoutGrid,
  Settings, HelpCircle, Wallet, ChevronDown, ChevronRight, ChevronLeft, X,
  ArrowDownToLine, Copy, Check, RefreshCw,
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getWalletBalances } from '@/lib/api'
import { getSimSpent } from '@/lib/auth'
import type { DerivedCategory } from '@/lib/categories'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { AnimatePresence, motion } from 'framer-motion'
import { useIsMobile } from '@/hooks/useIsMobile'
import QRCode from 'react-qr-code'

export type View = 'shop' | 'orders' | 'saved' | 'refer' | 'categories'

const SPRING = { type: 'spring' as const, damping: 32, stiffness: 300 }

const NAV: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'shop',       label: 'Shop',       icon: ShoppingBag },
  { id: 'orders',     label: 'Orders',     icon: ScrollText  },
  { id: 'saved',      label: 'Saved',      icon: Bookmark    },
  { id: 'refer',      label: 'Refer',      icon: Users       },
  { id: 'categories', label: 'Categories', icon: Grid2X2     },
]

type Balance = { usdc: string; usdbt: string }
type CachedBalance = Balance & { simulated?: boolean }
const balanceCache = new Map<string, CachedBalance>()

function applySimOffset(raw: CachedBalance, address: string): Balance {
  if (!raw.simulated) return raw
  const spent = getSimSpent(address)
  const net = Math.max(0, parseFloat(raw.usdc) - spent)
  return { usdc: net.toFixed(2), usdbt: raw.usdbt }
}

function useWalletBalance(address?: string) {
  const [rawBalance, setRawBalance] = useState<CachedBalance | null>(
    address ? (balanceCache.get(address) ?? null) : null
  )
  const [loading, setLoading] = useState(false)

  const balance = rawBalance && address ? applySimOffset(rawBalance, address) : rawBalance

  const fetchBalance = useCallback(async (bust = false) => {
    if (!address) return
    if (!bust && balanceCache.has(address)) {
      setRawBalance(balanceCache.get(address)!)
      return
    }
    setLoading(true)
    try {
      const data = await getWalletBalances(address)
      balanceCache.set(address, data)
      setRawBalance(data)
    } catch {}
    finally { setLoading(false) }
  }, [address])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  const reload = useCallback(() => {
    if (address) balanceCache.delete(address)
    fetchBalance(true)
  }, [address, fetchBalance])

  return { balance, loading, reload }
}

function BalanceDrawer({ open, onClose, balance, loading, onReload }: {
  open: boolean
  onClose: () => void
  balance: Balance | null
  loading: boolean
  onReload: () => void
}) {
  const { address, isConnected } = useAccount()
  const [copied, setCopied] = useState(false)
  const isMobile = useIsMobile()

  function copy() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Left-side drawer on desktop, bottom sheet on mobile
  const slideIn  = isMobile ? { y: 0 }       : { x: 0 }
  const slideOut = isMobile ? { y: '100%' }  : { x: '-100%' }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="balance-backdrop"
            className="fixed inset-0 z-50 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            key="balance-panel"
            className={[
              'fixed z-50 bg-white shadow-2xl flex flex-col',
              'inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh]',
              'md:inset-x-auto md:left-0 md:top-0 md:bottom-0 md:w-80 md:rounded-none md:max-h-none',
            ].join(' ')}
            initial={isMobile ? { y: '100%' } : { x: '-100%' }}
            animate={slideIn}
            exit={slideOut}
            transition={SPRING}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 md:hidden" />

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Wallet</h2>
              <div className="flex items-center gap-1">
                <motion.button
                  onClick={onReload}
                  whileTap={{ scale: 0.88 }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                  title="Refresh balance"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </motion.button>
                <motion.button
                  onClick={onClose}
                  whileTap={{ scale: 0.88 }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X size={16} />
                </motion.button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {!isConnected ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Wallet size={28} className="text-gray-200" />
                  <p className="text-sm text-gray-500">Connect a wallet to see your balance</p>
                  <ConnectButton />
                </div>
              ) : (
                <>
                  {/* QR code */}
                  {address && (
                    <div className="flex flex-col items-center py-4 gap-3">
                      <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <QRCode value={address} size={140} />
                      </div>
                      <p className="text-[10px] text-gray-400 text-center">Scan to receive funds</p>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Connected address</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-700 flex-1 break-all leading-relaxed">{address}</code>
                      <motion.button
                        onClick={copy}
                        whileTap={{ scale: 0.88 }}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 flex-shrink-0 transition-colors"
                      >
                        {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Balances</p>
                    <div className="space-y-2">
                      {[
                        { label: 'USDC',   sub: 'USD Coin on Base',    value: balance?.usdc ?? '—' },
                        { label: '$USDBT', sub: 'USDBT token on Base', value: balance?.usdbt ?? '—' },
                      ].map(({ label, sub, value }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{label}</p>
                            <p className="text-xs text-gray-400">{sub}</p>
                          </div>
                          <p className={`text-sm font-medium ${loading ? 'text-gray-300 animate-pulse' : 'text-gray-600'}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#eef0ff] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowDownToLine size={14} style={{ color: '#2b2bf5' }} />
                      <p className="text-xs font-semibold" style={{ color: '#2b2bf5' }}>How to add funds</p>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Send USDC to your wallet address above on the Base network.
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function SidebarContent({
  active,
  onNavigate,
  onClose,
  onSettingsClick,
  onHelpClick,
  onBalanceClick,
  onReloadBalance,
  balance,
  balanceLoading,
  shopExpanded,
  onShopToggle,
  onSubCategorySelect,
  categories = [],
  collapsed = false,
}: {
  active: View | null
  onNavigate: (v: View) => void
  onClose?: () => void
  onSettingsClick?: () => void
  onHelpClick?: () => void
  onBalanceClick?: () => void
  onReloadBalance?: () => void
  balance: Balance | null
  balanceLoading: boolean
  shopExpanded: boolean
  onShopToggle: () => void
  onSubCategorySelect?: (slug: string | null) => void
  categories?: DerivedCategory[]
  collapsed?: boolean
}) {
  function handleNavClick(id: View) {
    if (id === 'shop' && !collapsed) onShopToggle()
    onNavigate(id)
    if (id !== 'shop') onClose?.()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center py-[18px] flex-shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        <a
          href="https://usdbt.us"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-lg hover:opacity-80 transition-opacity"
          title="Go to usdbt.us"
        >
          <Image src="/logo.png" alt="USDBT" width={38} height={38} className="rounded-lg" />
          {!collapsed && <span className="font-bold text-[19px] text-gray-900 tracking-tight">USDBT</span>}
        </a>
        {onClose && !collapsed && (
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon }) => (
          <div key={id}>
            <motion.button
              onClick={() => handleNavClick(id)}
              whileTap={{ scale: 0.97 }}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${collapsed ? 'justify-center' : ''} ${
                active === id
                  ? 'bg-[--color-brand-light] text-[--color-brand] border border-[rgba(43,43,245,0.3)] shadow-[inset_4px_4px_10px_rgba(43,43,245,0.12),inset_-4px_-4px_10px_rgba(43,43,245,0.12)]'
                  : 'text-gray-500 border border-transparent hover:bg-gray-50 hover:text-gray-800 hover:border-[rgba(43,43,245,0.15)] hover:shadow-[inset_4px_4px_10px_rgba(43,43,245,0.06),inset_-4px_-4px_10px_rgba(43,43,245,0.06)]'
              }`}
            >
              <Icon size={15} className={active === id ? 'text-[--color-brand]' : 'text-gray-400'} />
              {!collapsed && <span className="flex-1 text-left">{label}</span>}
              {id === 'shop' && !collapsed && (
                <motion.div
                  animate={{ rotate: shopExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown
                    size={12}
                    className={active === id ? 'opacity-60' : 'text-gray-300'}
                  />
                </motion.div>
              )}
            </motion.button>

            <AnimatePresence initial={false}>
              {id === 'shop' && shopExpanded && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden ml-4 mt-0.5"
                >
                  <div className="space-y-0.5 pb-1 max-h-64 overflow-y-auto">
                    <motion.button
                      onClick={() => { onSubCategorySelect?.(null); onNavigate('shop'); onClose?.() }}
                      whileTap={{ scale: 0.96 }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] text-gray-500 border border-transparent hover:border-[rgba(43,43,245,0.2)] hover:shadow-[inset_3px_3px_8px_rgba(43,43,245,0.08),inset_-3px_-3px_8px_rgba(43,43,245,0.08)] hover:text-gray-700 transition-all"
                    >
                      <LayoutGrid size={12} className="text-gray-400 flex-shrink-0" />
                      All gift cards
                    </motion.button>
                    {categories.map(({ slug, label, icon: SubIcon }) => (
                      <motion.button
                        key={slug}
                        onClick={() => { onSubCategorySelect?.(slug); onNavigate('shop'); onClose?.() }}
                        whileTap={{ scale: 0.96 }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] text-gray-500 border border-transparent hover:border-[rgba(43,43,245,0.2)] hover:shadow-[inset_3px_3px_8px_rgba(43,43,245,0.08),inset_-3px_-3px_8px_rgba(43,43,245,0.08)] hover:text-gray-700 transition-all"
                      >
                        <SubIcon size={12} className="text-gray-400 flex-shrink-0" />
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="mt-auto border-t border-gray-100 pt-2 px-3 pb-4 space-y-0.5 flex-shrink-0">
        <motion.button
          onClick={() => { onSettingsClick?.(); onClose?.() }}
          whileTap={{ scale: 0.97 }}
          title={collapsed ? 'Settings' : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <Settings size={15} className="text-gray-400" />
          {!collapsed && 'Settings'}
        </motion.button>
        <motion.button
          onClick={() => { onHelpClick?.(); onClose?.() }}
          whileTap={{ scale: 0.97 }}
          title={collapsed ? 'Help' : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <HelpCircle size={15} className="text-gray-400" />
          {!collapsed && 'Help'}
        </motion.button>

        {collapsed ? (
          <button
            onClick={onBalanceClick}
            title="Balance"
            className="w-full mt-2 flex justify-center px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            <Wallet size={15} className="text-gray-400" />
          </button>
        ) : (
          <div className="mt-3 rounded-xl bg-white border border-[rgba(43,43,245,0.25)] shadow-[inset_5px_5px_12px_rgba(43,43,245,0.08),inset_-5px_-5px_12px_rgba(43,43,245,0.08)] hover:border-[rgba(43,43,245,0.5)] hover:shadow-[inset_7px_7px_16px_rgba(43,43,245,0.16),inset_-7px_-7px_16px_rgba(43,43,245,0.16)] transition-all overflow-hidden">
            <motion.button
              onClick={onBalanceClick}
              whileTap={{ scale: 0.98 }}
              className="w-full px-3 pt-3 pb-2 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wallet size={13} className="text-gray-400" />
                  <span className="text-[12px] font-medium text-gray-500">Balance</span>
                </div>
                <ChevronRight size={12} className="text-gray-400" />
              </div>
              <p className={`text-[11px] mt-0.5 ${balanceLoading ? 'text-gray-300 animate-pulse' : 'text-gray-400'}`}>
                {balance ? `${balance.usdc} USDC` : '— USDC'}
              </p>
            </motion.button>
            <div className="px-3 pb-2">
              <button
                onClick={(e) => { e.stopPropagation(); onReloadBalance?.() }}
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-[#2b2bf5] transition-colors"
              >
                <RefreshCw size={10} className={balanceLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar({
  active,
  onNavigate,
  mobileOpen,
  onMobileClose,
  onSettingsClick,
  onHelpClick,
  onSubCategorySelect,
  categories = [],
  balanceOpen: balanceOpenProp,
  onBalanceOpenChange,
  balanceRefreshKey,
}: {
  active: View | null
  onNavigate: (v: View) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
  onSettingsClick?: () => void
  onHelpClick?: () => void
  onSubCategorySelect?: (slug: string | null) => void
  categories?: DerivedCategory[]
  balanceOpen?: boolean
  onBalanceOpenChange?: (open: boolean) => void
  balanceRefreshKey?: number
}) {
  const [shopExpanded, setShopExpanded] = useState(false)
  const [balanceOpenInternal, setBalanceOpenInternal] = useState(false)
  const balanceOpen = balanceOpenProp ?? balanceOpenInternal
  const setBalanceOpen = (open: boolean) => {
    onBalanceOpenChange ? onBalanceOpenChange(open) : setBalanceOpenInternal(open)
  }
  const [collapsed, setCollapsed] = useState(false)
  const { address, isConnected } = useAccount()
  const { balance, loading: balanceLoading, reload: reloadBalance } = useWalletBalance(isConnected ? address : undefined)

  // When parent increments balanceRefreshKey (e.g. after a purchase), bust cache and re-read localStorage offset
  useEffect(() => {
    if (balanceRefreshKey) reloadBalance()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balanceRefreshKey])

  const sharedProps = {
    active,
    onNavigate,
    onSettingsClick,
    onHelpClick,
    shopExpanded,
    onShopToggle: () => setShopExpanded((e) => !e),
    onSubCategorySelect,
    categories,
    balance,
    balanceLoading,
    onReloadBalance: reloadBalance,
  }

  return (
    <>
      <BalanceDrawer open={balanceOpen} onClose={() => setBalanceOpen(false)} balance={balance} loading={balanceLoading} onReload={reloadBalance} />

      {/* Desktop sidebar */}
      <aside
        className={`relative hidden md:flex flex-col flex-shrink-0 bg-white border-r border-gray-100 h-full transition-[width] duration-200 ${collapsed ? 'w-[68px]' : 'w-[190px]'}`}
      >
        <SidebarContent
          {...sharedProps}
          collapsed={collapsed}
          onBalanceClick={() => setBalanceOpen(true)}
        />
        {/* Collapse toggle on the right border */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-1/2 -right-3 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-[#2b2bf5] hover:border-[#2b2bf5] transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              className="fixed inset-0 z-30 bg-black/30 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
            />
            <motion.div
              key="sidebar-panel"
              className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-white rounded-t-2xl shadow-2xl overflow-hidden"
              style={{ maxHeight: '85vh' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={SPRING}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />
              <SidebarContent
                {...sharedProps}
                onClose={onMobileClose}
                onBalanceClick={() => { setBalanceOpen(true); onMobileClose?.() }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
