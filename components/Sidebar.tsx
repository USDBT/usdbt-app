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

export type View = 'shop' | 'orders' | 'saved' | 'refer' | 'categories'

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

  function copy() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      <div className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Wallet</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
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
              {/* Address */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Connected address</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-gray-700 flex-1 break-all leading-relaxed">
                    {address}
                  </code>
                  <button onClick={copy} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 flex-shrink-0">
                    {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Balances */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Balances</p>
                <div className="space-y-2">
                  {[
                    { label: 'USDC', sub: 'USD Coin on Base', value: '0.00' },
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

              {/* Add funds hint */}
              <div className="bg-[#eef0ff] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownToLine size={14} style={{ color: '#2b2bf5' }} />
                  <p className="text-xs font-semibold" style={{ color: '#2b2bf5' }}>How to add funds</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Send USDC to your wallet address above on the Base network. Purchase gift cards directly from your USDC balance.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export function Sidebar({
  active,
  onNavigate,
  mobileOpen,
  onMobileClose,
  onSettingsClick,
  onHelpClick,
}: {
  active: View
  onNavigate: (v: View) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
  onSettingsClick?: () => void
  onHelpClick?: () => void
}) {
  const [shopExpanded, setShopExpanded] = useState(false)
  const [balanceOpen, setBalanceOpen] = useState(false)

  function handleNavClick(id: View) {
    if (id === 'shop') setShopExpanded(e => !e)
    onNavigate(id)
    if (id !== 'shop') onMobileClose?.()
  }

  return (
    <>
      <BalanceDrawer open={balanceOpen} onClose={() => setBalanceOpen(false)} />

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 w-[190px] flex-shrink-0 flex flex-col bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out',
          'md:relative md:translate-x-0 md:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-[18px] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="$USDBT" width={28} height={28} className="rounded-lg" />
            <span className="font-semibold text-[15px] text-gray-900">$USDBT</span>
          </div>
          <button onClick={onMobileClose} className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={14} />
          </button>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <div key={id}>
              <button
                onClick={() => handleNavClick(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  active === id
                    ? 'bg-[--color-brand-light] text-[--color-brand]'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon size={15} className={active === id ? 'text-[--color-brand]' : 'text-gray-400'} />
                <span className="flex-1 text-left">{label}</span>
                {id === 'shop' && (
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${shopExpanded ? 'rotate-180' : ''} ${active === id ? 'opacity-60' : 'text-gray-300'}`}
                  />
                )}
              </button>

              {id === 'shop' && shopExpanded && (
                <div className="ml-4 mt-0.5 space-y-0.5 pb-1">
                  {SHOP_SUBS.map(({ label: sub, icon: SubIcon }) => (
                    <button
                      key={sub}
                      onClick={() => { onNavigate('shop'); onMobileClose?.() }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                    >
                      <SubIcon size={12} className="text-gray-400 flex-shrink-0" />
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="mt-auto border-t border-gray-100 pt-2 px-3 pb-4 space-y-0.5 flex-shrink-0">
          <button
            onClick={onSettingsClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            <Settings size={15} className="text-gray-400" />
            Settings
          </button>
          <button
            onClick={onHelpClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            <HelpCircle size={15} className="text-gray-400" />
            Help
          </button>

          {/* Balance — clickable */}
          <button
            onClick={() => setBalanceOpen(true)}
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
          </button>
        </div>
      </aside>
    </>
  )
}
