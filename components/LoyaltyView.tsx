'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Trophy, Award, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react'
import { getLoyaltyStats, type LoyaltyStats } from '@/lib/api'

const TIERS = [
  { id: 'bronze', name: 'Bronze', threshold: '0 pts', rate: '10 pts / $1', perk: 'Base Rate' },
  { id: 'silver', name: 'Silver', threshold: '1,000 pts', rate: '12 pts / $1', perk: '+2% Off Cards' },
  { id: 'gold', name: 'Gold', threshold: '5,000 pts', rate: '15 pts / $1', perk: '+3% Off Cards' },
  { id: 'platinum', name: 'Platinum', threshold: '20,000 pts', rate: '20 pts / $1', perk: '+5% Off Cards' },
]

export function LoyaltyView({ address }: { address?: string }) {
  const [stats, setStats] = useState<LoyaltyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }
    getLoyaltyStats(address)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [address])

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Sparkles size={32} className="text-gray-300 mb-3" />
        <p className="text-sm font-semibold text-gray-700">Connect wallet to view loyalty rewards</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">Earn 10+ points for every $1 spent and unlock tier discounts.</p>
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

  const currentPoints = stats?.pointsBalance ?? 150
  const lifetimePoints = stats?.lifetimePoints ?? 150
  const currentTier = stats?.tier ?? 'bronze'
  const nextThreshold = stats?.nextTierThreshold ?? 1000
  const progressPct = Math.min(100, Math.round((lifetimePoints / nextThreshold) * 100))

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl p-6 text-white bg-gradient-to-r from-[#2b2bf5] via-[#4338ca] to-[#1e1b4b] shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <Trophy size={13} />
              {currentTier} Tier Member
            </div>
            <h1 className="text-2xl font-bold">Loyalty & Repeat Rewards</h1>
            <p className="text-xs text-white/80 mt-1 max-w-md">
              Every purchase earns crypto loyalty points. Redeem points for direct checkout discounts!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-center min-w-[160px]">
            <span className="text-xs text-white/70 block uppercase font-medium">Available Points</span>
            <span className="text-3xl font-extrabold font-mono tracking-tight">{currentPoints}</span>
            <span className="text-[11px] text-white/60 block mt-0.5">≈ ${(currentPoints / 100).toFixed(2)} checkout credit</span>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/15 relative z-10">
          <div className="flex justify-between text-xs text-white/90 mb-1.5 font-medium">
            <span>Progress to Next Tier</span>
            <span>{lifetimePoints} / {nextThreshold} pts ({progressPct}%)</span>
          </div>
          <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TIERS.map((t) => {
          const isCurrent = t.id === currentTier
          return (
            <div
              key={t.id}
              className={`rounded-xl p-4 border transition-all ${
                isCurrent
                  ? 'border-[#2b2bf5] bg-[#f8f9ff] ring-2 ring-[rgba(43,43,245,0.15)]'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-800">{t.name}</span>
                {isCurrent && <Award size={15} className="text-[#2b2bf5]" />}
              </div>
              <p className="text-xs text-gray-500">{t.threshold}</p>
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                <p className="text-[11px] font-semibold text-gray-900">{t.rate}</p>
                <p className="text-[11px] text-emerald-600 font-medium">{t.perk}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* How it Works & History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Perks Box */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Sparkles size={16} className="text-[#2b2bf5]" />
            How Loyalty Rewards Work
          </h3>
          <ul className="text-xs text-gray-600 space-y-2.5">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Earn 10-20 points per $1:</strong> Automatically credited as soon as gift card is delivered.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Redeem at Checkout:</strong> 100 points equals $1.00 off any gift card or voucher.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>No Expiration:</strong> Points never expire as long as your wallet is active.</span>
            </li>
          </ul>
        </div>

        {/* History Box */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <TrendingUp size={16} className="text-[#2b2bf5]" />
            Points Activity
          </h3>
          <div className="space-y-2">
            {(stats?.transactions?.length ?? 0) === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No points transactions yet.</p>
            ) : (
              stats?.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                  <span className="capitalize text-gray-700 font-medium">{tx.action.replace('_', ' ')}</span>
                  <span className={`font-mono font-bold ${tx.points_delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.points_delta > 0 ? `+${tx.points_delta}` : tx.points_delta} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
