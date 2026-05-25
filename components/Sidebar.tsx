'use client'

import Image from 'next/image'
import {
  ShoppingBag, ScrollText, Bookmark, Users, Grid2X2,
  Settings, HelpCircle, Wallet, ChevronDown, ChevronRight,
} from 'lucide-react'

export type View = 'shop' | 'orders' | 'saved' | 'refer' | 'categories'

const NAV: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'shop',       label: 'Shop',       icon: ShoppingBag },
  { id: 'orders',     label: 'Orders',     icon: ScrollText  },
  { id: 'saved',      label: 'Saved',      icon: Bookmark    },
  { id: 'refer',      label: 'Refer',      icon: Users       },
  { id: 'categories', label: 'Categories', icon: Grid2X2     },
]

export function Sidebar({ active, onNavigate }: { active: View; onNavigate: (v: View) => void }) {
  return (
    <aside className="w-[190px] flex-shrink-0 flex flex-col bg-white border-r border-gray-100 h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-[18px]">
        <Image src="/logo.png" alt="$USDBT" width={28} height={28} className="rounded-lg" />
        <span className="font-semibold text-[15px] text-gray-900">$USDBT</span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              active === id
                ? 'bg-[--color-brand-light] text-[--color-brand]'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <Icon size={15} className={active === id ? 'text-[--color-brand]' : 'text-gray-400'} />
            <span>{label}</span>
            {id === 'shop' && active === 'shop' && (
              <ChevronDown size={12} className="ml-auto text-[--color-brand] opacity-60" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="mt-auto border-t border-gray-100 pt-2 px-3 pb-4 space-y-0.5">
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
          <Settings size={15} className="text-gray-400" />
          Settings
        </button>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
          <HelpCircle size={15} className="text-gray-400" />
          Help
        </button>

        {/* Balance */}
        <div className="mt-3 px-3 py-3 rounded-xl bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet size={13} className="text-gray-400" />
              <span className="text-[12px] font-medium text-gray-500">Balance</span>
            </div>
            <ChevronRight size={12} className="text-gray-400" />
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[--color-brand] rounded-full" style={{ width: '0%' }} />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">0.00 USDC available</p>
        </div>
      </div>
    </aside>
  )
}
