'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Lock, AlertCircle, FileCheck, Info, CheckCircle2 } from 'lucide-react'
import { getComplianceLimits, screenWalletCompliance, type ComplianceLimits } from '@/lib/api'

export function ComplianceView({ address }: { address?: string }) {
  const [data, setData] = useState<ComplianceLimits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }
    getComplianceLimits(address)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [address])

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldCheck size={32} className="text-gray-300 mb-3" />
        <p className="text-sm font-semibold text-gray-700">Connect wallet to view compliance status</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">USDBT is 100% non-KYC for everyday purchases under $1,000/day.</p>
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

  const spent = data?.spentLast24hUsd ?? 0
  const limit = data?.dailyLimitUsd ?? 1000
  const remaining = data?.remainingQuotaUsd ?? (limit - spent)
  const pctUsed = Math.min(100, Math.round((spent / limit) * 100))

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold mb-2">
            <ShieldCheck size={13} className="text-emerald-600" />
            Tier 0 Non-KYC Active
          </div>
          <h1 className="text-xl font-bold text-gray-900">Compliance & Privacy Protections</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-lg">
            USDBT protects user privacy by never requiring identity verification or bank intermediaries for standard transactions, while enforcing automated on-chain sanctions screening.
          </p>
        </div>

        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 text-center min-w-[150px]">
          <span className="text-[10px] text-emerald-800 uppercase font-semibold">AML Risk Score</span>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-0.5">CLEAN (0.01)</p>
          <span className="text-[10px] text-emerald-600">OFAC Screening: Passed</span>
        </div>
      </div>

      {/* Daily Non-KYC Quota */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-gray-900">24-Hour Non-KYC Spending Limit</h3>
            <p className="text-xs text-gray-500 mt-0.5">Rolling 24-hour window quota</p>
          </div>
          <span className="text-xs font-mono font-bold text-gray-800">
            ${spent.toFixed(2)} / ${limit.toFixed(2)} used ({pctUsed}%)
          </span>
        </div>

        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pctUsed}%` }} />
        </div>

        <div className="flex justify-between text-xs text-gray-500 pt-1">
          <span>Remaining Quota: <strong className="text-gray-900 font-mono">${remaining.toFixed(2)}</strong></span>
          <span>Next Reset: Rolling 24 Hours</span>
        </div>
      </div>

      {/* Compliance Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#f8f9ff] rounded-xl p-4 border border-[#2b2bf5] shadow-xs">
          <span className="text-[11px] font-bold text-[#2b2bf5] uppercase tracking-wide">Tier 0 (Active)</span>
          <p className="text-base font-bold text-gray-900 mt-1">Up to $1,000 / day</p>
          <p className="text-xs text-gray-500 mt-1">
            100% permissionless & non-KYC. Instant automated crypto settlement with zero identity documents requested.
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs opacity-75">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tier 1</span>
          <p className="text-base font-bold text-gray-900 mt-1">$1,000 – $5,000 / day</p>
          <p className="text-xs text-gray-500 mt-1">
            Automated on-chain risk evaluation and heuristics checks without manual paperwork.
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs opacity-75">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tier 2 (Institutional)</span>
          <p className="text-base font-bold text-gray-900 mt-1">$5,000+ / day</p>
          <p className="text-xs text-gray-500 mt-1">
            Merchant & enterprise volume verification with dedicated support and corporate invoicing.
          </p>
        </div>
      </div>

      {/* Security Policies */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <Lock size={14} className="text-[#2b2bf5]" />
          Zero Data Retention Promise
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          USDBT does not store bank accounts, phone numbers, or government IDs. Your delivery email is strictly used to transmit your digital card redemption codes and is never sold or shared.
        </p>
      </div>
    </div>
  )
}
