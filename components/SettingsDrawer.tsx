'use client'

import { X, Globe, Wallet, Shield, Moon, Bell } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast.success(`${label} copied`)
}

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { address } = useAccount()
  const { theme, setTheme } = useTheme()
  const [notifs, setNotifs] = useState(true)
  const isDark = theme === 'dark'

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      <div className={[
        'fixed z-50 bg-white shadow-2xl flex flex-col',
        'inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh]',
        'md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:w-full md:max-w-sm md:rounded-none md:max-h-none',
      ].join(' ')}>
        {/* Drag handle (mobile only) */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Account */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Account</p>
            <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
              {/* Wallet address — click to copy */}
              <button
                onClick={() => address && copy(address, 'Wallet address')}
                disabled={!address}
                className="w-full flex items-center gap-3 py-3 px-4 hover:bg-gray-50 transition-colors text-left disabled:opacity-40"
              >
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Wallet size={15} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Connected Wallet</p>
                  <p className="text-xs text-gray-400 truncate">
                    {address ? `${address.slice(0, 8)}…${address.slice(-6)}` : 'Not connected'}
                  </p>
                </div>
              </button>

              {/* Network — click to copy */}
              <button
                onClick={() => copy('Base Mainnet', 'Network')}
                className="w-full flex items-center gap-3 py-3 px-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Globe size={15} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Network</p>
                  <p className="text-xs text-gray-400">Base Mainnet</p>
                </div>
              </button>

              {/* Privacy — static */}
              <div className="flex items-center gap-3 py-3 px-4">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Shield size={15} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Privacy</p>
                  <p className="text-xs text-gray-400">No KYC required</p>
                </div>
                <span className="text-xs text-green-500 font-medium flex-shrink-0">Active</span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Preferences</p>
            <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 py-3 px-4">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Bell size={15} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Order Notifications</p>
                  <p className="text-xs text-gray-400">Notified when card is delivered</p>
                </div>
                <Switch
                  checked={notifs}
                  onCheckedChange={setNotifs}
                />
              </div>

              <div className="flex items-center gap-3 py-3 px-4">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Moon size={15} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Dark Mode</p>
                  <p className="text-xs text-gray-400">Toggle dark theme</p>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Payment</p>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 py-3 px-4">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Wallet size={15} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Default Currency</p>
                  <p className="text-xs text-gray-400">USDC on Base</p>
                </div>
                <span className="text-xs text-gray-500 font-medium flex-shrink-0">USDC</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-300 text-center">$USDBT · v0.1.0 · No KYC</p>
        </div>
      </div>
    </>
  )
}
