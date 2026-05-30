'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Bell, BellRing, CreditCard, Activity, DollarSign, LifeBuoy, Menu, X } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { toast } from 'sonner'

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
  onHamburgerClick,
  onOpenSearch,
}: {
  search: string
  onSearch: (v: string) => void
  activeTab: Tab
  onTabChange: (t: Tab) => void
  onHamburgerClick: () => void
  onOpenSearch?: () => void
}) {
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) { setPerm('unsupported'); return }
    setPerm(Notification.permission)
  }, [notifOpen])

  async function enableNotifications() {
    if (!('Notification' in window)) { toast.error('Notifications not supported in this browser'); return }
    const result = await Notification.requestPermission()
    setPerm(result)
    if (result === 'granted') {
      localStorage.setItem('usdbt_notifs', 'true')
      toast.success('Notifications enabled — we’ll ping you on order updates')
      new Notification('USDBT notifications on', { body: "You'll get order status updates here.", icon: '/logo.png' })
    } else {
      toast.error('Notifications blocked. Enable them in your browser settings.')
    }
  }

  return (
    <header className="h-[60px] flex items-center px-4 bg-white border-b border-gray-100 gap-3 flex-shrink-0 relative">
      {/* Hamburger — mobile only */}
      <button
        onClick={onHamburgerClick}
        className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 flex-shrink-0"
      >
        <Menu size={18} />
      </button>

      {/* Tab pills */}
      <div className="hidden sm:flex items-center gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === id
                ? 'text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
            style={activeTab === id ? { backgroundColor: '#2b2bf5' } : undefined}
          >
            <Icon size={14} />
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-2">
        {/* Desktop search */}
        <div className="hidden md:block relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search… (⌘K)"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            onFocus={() => { onOpenSearch?.() }}
            readOnly={!!onOpenSearch}
            className="pl-9 pr-4 py-2 text-sm bg-gray-100 rounded-xl outline-none w-44 focus:bg-white transition-all cursor-pointer"
          />
        </div>

        {/* Mobile search icon */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
        >
          <Search size={17} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
          >
            <Bell size={17} />
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-11 z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">Notifications</span>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
                  >
                    <X size={13} />
                  </button>
                </div>
                {perm === 'granted' ? (
                  <div className="py-12 flex flex-col items-center gap-2">
                    <BellRing size={24} className="text-[#2b2bf5]" />
                    <p className="text-sm text-gray-500">Notifications are on</p>
                    <p className="text-xs text-gray-300">Order updates will pop up here & on your device</p>
                  </div>
                ) : perm === 'unsupported' ? (
                  <div className="py-12 flex flex-col items-center gap-2 px-6 text-center">
                    <Bell size={24} className="text-gray-200" />
                    <p className="text-sm text-gray-400">Not supported</p>
                    <p className="text-xs text-gray-300">This browser doesn’t support notifications</p>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center gap-3 px-5 text-center">
                    <Bell size={24} className="text-gray-300" />
                    <p className="text-sm text-gray-500">Get notified on order updates</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {perm === 'denied'
                        ? 'Notifications are blocked. Re-enable them in your browser’s site settings.'
                        : 'Allow browser notifications so we can ping you when your card is delivered.'}
                    </p>
                    {perm !== 'denied' && (
                      <button
                        onClick={enableNotifications}
                        className="mt-1 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors"
                        style={{ backgroundColor: '#2b2bf5' }}
                      >
                        Enable notifications
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <ConnectButton accountStatus="avatar" showBalance={false} chainStatus="none" />
      </div>
    </header>
  )
}
