'use client'

import { X, Bell, Globe, Wallet, Shield, Moon, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useAccount } from 'wagmi'

function Row({
  icon: Icon,
  label,
  sub,
  right,
}: {
  icon: React.ElementType
  label: string
  sub?: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {right ?? <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-[#2b2bf5]' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { address } = useAccount()
  const [notifs, setNotifs] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col">
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
            <Row
              icon={Wallet}
              label="Connected Wallet"
              sub={address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Not connected'}
            />
            <Row icon={Globe} label="Network" sub="Base Mainnet" />
            <Row icon={Shield} label="Privacy" sub="No KYC required" right={
              <span className="text-xs text-green-500 font-medium">Active</span>
            } />
          </div>

          {/* Preferences */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Preferences</p>
            <Row
              icon={Bell}
              label="Order Notifications"
              sub="Get notified when your card is delivered"
              right={<Toggle value={notifs} onChange={setNotifs} />}
            />
            <Row
              icon={Moon}
              label="Dark Mode"
              sub="Coming soon"
              right={<Toggle value={darkMode} onChange={setDarkMode} />}
            />
          </div>

          {/* Currency */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Payment</p>
            <Row
              icon={Wallet}
              label="Default Currency"
              sub="USDC on Base"
              right={<span className="text-xs text-gray-500 font-medium">USDC</span>}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-300 text-center">$USDBT · v0.1.0 · No KYC</p>
        </div>
      </div>
    </>
  )
}
