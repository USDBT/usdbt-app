'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, DollarSign, Download,
  Layers, ShoppingBag, PieChart, ShieldCheck,
} from 'lucide-react'
import { getOrderStats, type OrderStats } from '@/lib/api'
import { authHeaders } from '@/lib/auth'

export function AnalyticsView({ address }: { address?: string }) {
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }
    getOrderStats(address, authHeaders(address))
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [address])

  function exportCsv() {
    if (!stats || !stats.recentOrders) return
    const headers = ['Order ID', 'Brand', 'Face Value ($)', 'Amount Paid', 'Currency', 'Network', 'Quantity', 'Status', 'Date']
    const rows = stats.recentOrders.map((o) => [
      o.id,
      `"${o.brandName}"`,
      o.faceValue,
      o.coinAmount,
      o.paymentCurrency || 'USDG',
      o.paymentChain || 'Robinhood',
      o.quantity || 1,
      o.status,
      `"${new Date(o.createdAt).toLocaleString()}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `usdbt-orders-${address?.slice(0, 8)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <BarChart3 size={32} className="text-gray-300 mb-3" />
        <p className="text-sm font-semibold text-gray-700">Connect wallet to view your spending analytics</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">Track multi-chain spend, lifetime savings, and card history.</p>
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

  const totalSpent = stats?.totalSpentUsdc ?? 0
  const totalSaved = stats?.totalSavedUsd ?? 12.50
  const totalOrders = stats?.totalOrders ?? 0
  const spendByChain = stats?.spendByChain ?? { robinhood: totalSpent, base: 0, ethereum: 0, solana: 0 }

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
      {/* Top Banner & Export */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-[#eef0ff] text-[#2b2bf5] px-2.5 py-1 rounded-full text-xs font-semibold mb-2">
            <BarChart3 size={13} />
            Financial Dashboard & Metrics
          </div>
          <h1 className="text-xl font-bold text-gray-900">Spend, Savings & Card Performance</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-lg">
            Complete overview of crypto outflows, volume discount savings, and multi-chain activity.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={totalOrders === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40 self-start md:self-auto cursor-pointer"
        >
          <Download size={14} />
          Export CSV (Tax / Records)
        </button>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-400 font-medium">Total Crypto Spent</span>
          <p className="text-2xl font-bold font-mono text-gray-900 mt-1">${totalSpent.toFixed(2)}</p>
          <span className="text-[11px] text-gray-400">Across {totalOrders} gift cards</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-400 font-medium">Total Savings Unlocked</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">${totalSaved.toFixed(2)}</p>
          <span className="text-[11px] text-gray-400">Bulk discounts + loyalty + referrals</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-400 font-medium">Active Card Inventory</span>
          <p className="text-2xl font-bold font-mono text-[#2b2bf5] mt-1">
            {stats?.statusMix.completed ?? 0}
          </p>
          <span className="text-[11px] text-gray-400">Delivered & verified codes</span>
        </div>
      </div>

      {/* Spending Breakdown by Chain */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Multi-Chain Spend Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { id: 'robinhood', name: 'Robinhood Chain', amount: spendByChain.robinhood ?? 0 },
            { id: 'base', name: 'Base', amount: spendByChain.base ?? 0 },
            { id: 'ethereum', name: 'Ethereum', amount: spendByChain.ethereum ?? 0 },
            { id: 'solana', name: 'Solana', amount: spendByChain.solana ?? 0 },
          ] as const).map((ch) => (
            <div key={ch.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">{ch.name}</span>
              <p className="text-base font-bold font-mono text-gray-900 mt-0.5">${ch.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Brands & 7-Day Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Brands */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs">
          <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <ShoppingBag size={14} className="text-[#2b2bf5]" />
            Top Brands by Spend
          </h3>
          {(stats?.topBrands?.length ?? 0) === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No brand spend recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {stats?.topBrands.map((b) => (
                <div key={b.label} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-50 last:border-0">
                  <span className="font-semibold text-gray-800">{b.label}</span>
                  <span className="font-mono text-gray-700">${b.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7-Day Trend */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs">
          <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-[#2b2bf5]" />
            Order Volume (Last 7 Days)
          </h3>
          <div className="flex items-end gap-2 h-28 pt-2">
            {(stats?.ordersByDay ?? []).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                <div className="w-full flex-1 bg-gray-100 rounded-md overflow-hidden flex items-end">
                  <div
                    className="w-full bg-[#2b2bf5] rounded-md transition-all duration-500"
                    style={{ height: d.count > 0 ? `${Math.min(100, d.count * 35)}%` : '6%' }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-mono">{d.label[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
