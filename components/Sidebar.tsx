'use client'

import Image from 'next/image'
import {
  ShoppingBag, ScrollText, Bookmark, Users, Grid2X2,
  Settings, HelpCircle, Wallet, ChevronDown, ChevronRight, X,
  Gift, Gamepad2, Tv, Plane, Utensils, ShoppingCart,
} from 'lucide-react'
import { useState } from 'react'

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

export function Sidebar({
  active,
  onNavigate,
  mobileOpen,
  onMobileClose,
}: {
  active: View
  onNavigate: (v: View) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}) {
  const [shopExpanded, setShopExpanded] = useState(false)

  function handleNavClick(id: View) {
    if (id === 'shop') setShopExpanded(e => !e)
    onNavigate(id)
    if (id !== 'shop') onMobileClose?.()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onMobileClose}
        />
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
          <button
            onClick={onMobileClose}
            className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
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
                <Icon
                  size={15}
                  className={active === id ? 'text-[--color-brand]' : 'text-gray-400'}
                />
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
                      onClick={() => onMobileClose?.()}
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
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
            <Settings size={15} className="text-gray-400" />
            Settings
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
            <HelpCircle size={15} className="text-gray-400" />
            Help
          </button>

          <div className="mt-3 px-3 py-3 rounded-xl bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet size={13} className="text-gray-400" />
                <span className="text-[12px] font-medium text-gray-500">Balance</span>
              </div>
              <ChevronRight size={12} className="text-gray-400" />
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: '0%', backgroundColor: 'var(--color-brand)' }} />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">0.00 USDC available</p>
          </div>
        </div>
      </aside>
    </>
  )
}
