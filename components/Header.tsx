'use client'

import { Search, Bell, CreditCard, Activity, DollarSign, LifeBuoy } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export type Tab = 'cards' | 'activity' | 'spend' | 'support'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'cards',    label: 'Cards',    icon: CreditCard },
  { id: 'activity', label: 'Activity', icon: Activity   },
  { id: 'spend',    label: 'Spend',    icon: DollarSign },
  { id: 'support',  label: 'Support',  icon: LifeBuoy   },
]

export function Header({
  search,
  onSearch,
  activeTab,
  onTabChange,
}: {
  search: string
  onSearch: (v: string) => void
  activeTab: Tab
  onTabChange: (t: Tab) => void
}) {
  return (
    <header className="h-[60px] flex items-center px-5 bg-white border-b border-gray-100 gap-5 flex-shrink-0">
      {/* Tab group */}
      <div className="flex items-center gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-[--color-brand] text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search anything..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-gray-100 rounded-xl outline-none w-52 focus:bg-white focus:ring-2 focus:ring-[--color-brand] focus:ring-opacity-20 transition-all"
          />
        </div>
        <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
          <Bell size={17} />
        </button>
        <ConnectButton accountStatus="avatar" showBalance={false} chainStatus="none" />
      </div>
    </header>
  )
}
