'use client'

import Image from 'next/image'
import {
  ShoppingBag, ScrollText, Bookmark, Users, Grid2X2,
  Settings, HelpCircle, Wallet, ChevronDown, ChevronRight, X,
  Gift, Gamepad2, Tv, Plane, Utensils, ShoppingCart,
  ArrowDownToLine, Copy, Check,
} from 'lucide-react'
import { useState } from 'react'
import { useAccount } from 'wagmi'
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

const SHOP_SUBS = [
  { label: 'Gift Cards', icon: Gift },
  { label: 'Gaming',     icon: Gamepad2 },
  { label: 'Streaming',  icon: Tv },
  { label: 'Travel',     icon: Plane },
  { label: 'Food',       icon: Utensils },
  { label: 'Shopping',   icon: ShoppingCart },
]

function BalanceDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
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
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.88 }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={16} />
              </motion.button>
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
                        { label: 'USDC',   sub: 'USD Coin on Base',    value: '0.00' },
                        { label: '$USDBT', sub: 'USDBT token on Base', value: '0.00' },
                      ].map(({ label, sub, value }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{label}</p>
                            <p className="text-xs text-gray-400">{sub}</p>
                          </div>
                          <p className="text-sm font-medium text-gray-600">{value}</p>
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
  shopExpanded,
  onShopToggle,
  onSubCategorySelect,
}: {
  active: View
  onNavigate: (v: View) => void
  onClose?: () => void
  onSettingsClick?: () => void
  onHelpClick?: () => void
  onBalanceClick?: () => void
  shopExpanded: boolean
  onShopToggle: () => void
  onSubCategorySelect?: (label: string) => void
}) {
  function handleNavClick(id: View) {
    if (id === 'shop') onShopToggle()
    onNavigate(id)
    if (id !== 'shop') onClose?.()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-[18px] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="$USDBT" width={28} height={28} className="rounded-lg" />
          <span className="font-semibold text-[15px] text-gray-900">$USDBT</span>
        </div>
        {onClose && (
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
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                active === id
                  ? 'bg-[--color-brand-light] text-[--color-brand]'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon size={15} className={active === id ? 'text-[--color-brand]' : 'text-gray-400'} />
              <span className="flex-1 text-left">{label}</span>
              {id === 'shop' && (
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
              {id === 'shop' && shopExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden ml-4 mt-0.5"
                >
                  <div className="space-y-0.5 pb-1">
                    {SHOP_SUBS.map(({ label: sub, icon: SubIcon }) => (
                      <motion.button
                        key={sub}
                        onClick={() => { onSubCategorySelect?.(sub); onNavigate('shop'); onClose?.() }}
                        whileTap={{ scale: 0.96 }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                      >
                        <SubIcon size={12} className="text-gray-400 flex-shrink-0" />
                        {sub}
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
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <Settings size={15} className="text-gray-400" />
          Settings
        </motion.button>
        <motion.button
          onClick={() => { onHelpClick?.(); onClose?.() }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <HelpCircle size={15} className="text-gray-400" />
          Help
        </motion.button>

        <motion.button
          onClick={onBalanceClick}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-3 px-3 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet size={13} className="text-gray-400" />
              <span className="text-[12px] font-medium text-gray-500">Balance</span>
            </div>
            <ChevronRight size={12} className="text-gray-400" />
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: '0%', backgroundColor: '#2b2bf5' }} />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">0.00 USDC available</p>
        </motion.button>
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
}: {
  active: View
  onNavigate: (v: View) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
  onSettingsClick?: () => void
  onHelpClick?: () => void
  onSubCategorySelect?: (label: string) => void
}) {
  const [shopExpanded, setShopExpanded] = useState(false)
  const [balanceOpen, setBalanceOpen] = useState(false)

  const sharedProps = {
    active,
    onNavigate,
    onSettingsClick,
    onHelpClick,
    shopExpanded,
    onShopToggle: () => setShopExpanded((e) => !e),
    onSubCategorySelect,
  }

  return (
    <>
      <BalanceDrawer open={balanceOpen} onClose={() => setBalanceOpen(false)} />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[190px] flex-shrink-0 bg-white border-r border-gray-100 h-full">
        <SidebarContent
          {...sharedProps}
          onBalanceClick={() => setBalanceOpen(true)}
        />
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
