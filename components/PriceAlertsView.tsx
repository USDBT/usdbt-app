'use client'

import { useState, useEffect } from 'react'
import { Bell, Trash2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { getPriceAlerts, deletePriceAlert, togglePriceAlert, type PriceAlert } from '@/lib/api'

export function PriceAlertsView({ address }: { address?: string }) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }
    loadAlerts()
  }, [address])

  function loadAlerts() {
    if (!address) return
    getPriceAlerts(address)
      .then((data) => setAlerts(data.alerts))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }

  async function handleDelete(id: string) {
    await deletePriceAlert(id)
    setAlerts((list) => list.filter((a) => a.id !== id))
  }

  async function handleToggle(id: string) {
    const res = await togglePriceAlert(id)
    setAlerts((list) => list.map((a) => (a.id === id ? { ...a, is_active: res.alert.is_active } : a)))
  }

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Bell size={32} className="text-gray-300 mb-3" />
        <p className="text-sm font-semibold text-gray-700">Connect wallet to manage your price alerts</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">Never miss a discount or promotional card price swing.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 rounded-full border-2 border-[#2b2bf5] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold mb-2">
            <Bell size={13} />
            Price & Promo Swing Notifications
          </div>
          <h1 className="text-xl font-bold text-gray-900">Card Price & Discount Alerts</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-lg">
            We track exchange rate swings and promotional discounts across 500+ brands. You will receive an instant email notification as soon as a card hits your target rate.
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-xs text-center space-y-2">
          <Bell size={36} className="text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No Active Price Alerts</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Browse any gift card in the shop, switch to the Details tab, and tap "Set Price Drop / Promo Alert".
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.is_active ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Bell size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{a.brand_name}</h4>
                  <p className="text-xs text-gray-500">
                    Target: <strong className="text-emerald-600 font-semibold">{a.target_discount_pct}%+ discount</strong> · Sent to {a.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggle(a.id)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    a.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {a.is_active ? 'Active' : 'Paused'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
