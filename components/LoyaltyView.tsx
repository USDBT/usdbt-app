'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Trophy, Award, TrendingUp, CheckCircle2, Clock, Coins } from 'lucide-react'
import { convertPointsToUsdbt, getLoyaltyStats, getRewardsStatus, type LoyaltyStats, type RewardsStatus } from '@/lib/api'
import { authHeaders } from '@/lib/auth'

const TIERS = [
  { id: 'bronze', name: 'Bronze', threshold: '0 pts', rate: '1 pt / $1', perk: 'Base rate' },
  { id: 'silver', name: 'Silver', threshold: '1,000 pts', rate: '1.2 pts / $1', perk: '1.2× points' },
  { id: 'gold', name: 'Gold', threshold: '5,000 pts', rate: '1.5 pts / $1', perk: '1.5× points' },
  { id: 'platinum', name: 'Platinum', threshold: '20,000 pts', rate: '2 pts / $1', perk: '2× points' },
]

const ACTION_LABELS: Record<string, string> = {
  earn_order: 'Purchase reward',
  earn_referral: 'Referral reward',
  redeem_order: 'Used at checkout',
  refund_order: 'Returned (order failed)',
  reverse_earn_order: 'Reversed (order refunded)',
  reverse_earn_referral: 'Reversed (referral refunded)',
  convert_usdbt: 'Converted to $USDBT',
  convert_rejected: 'Conversion returned',
  welcome_bonus: 'Welcome bonus',
}

export function LoyaltyView({ address }: { address?: string }) {
  const [stats, setStats] = useState<LoyaltyStats | null>(null)
  const [program, setProgram] = useState<RewardsStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    getRewardsStatus().then(setProgram).catch(() => setProgram(null))
  }, [])

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

  async function handleConvert() {
    if (!address) return
    setConverting(true)
    setNotice(null)
    try {
      const result = await convertPointsToUsdbt(authHeaders(address))
      setNotice({ ok: true, text: result.message })
      setStats((s) => (s ? { ...s, pointsBalance: 0 } : s))
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : 'Could not convert your points. Try again.' })
    } finally {
      setConverting(false)
    }
  }

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Sparkles size={32} className="text-gray-300 mb-3" />
        <p className="text-sm font-semibold text-gray-700">Connect wallet to view your rewards</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">Earn points on every delivered gift card. Points convert to $USDBT when the token launches.</p>
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

  const launched = program?.usdbtLaunched ?? stats?.usdbtLaunched ?? false
  const minConvert = program?.minConvertPoints ?? 500
  const price = program?.usdbtPriceUsd ?? null
  const currentPoints = stats?.pointsBalance ?? 0
  const lifetimePoints = stats?.lifetimePoints ?? 0
  const currentTier = stats?.tier ?? 'bronze'
  const nextThreshold = stats?.nextTierThreshold ?? 1000
  const progressPct = Math.min(100, Math.round((lifetimePoints / nextThreshold) * 100))
  const valueUsd = currentPoints / 100

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
      {/* Launch status */}
      {launched ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Coins size={18} className="text-emerald-600 flex-shrink-0" />
          <div className="flex-1 text-xs text-emerald-900">
            <p className="font-semibold">$USDBT is live. Convert your points to $USDBT.</p>
            <p className="mt-0.5 text-emerald-800">
              100 points = $1 of $USDBT{price ? ` (about ${(1 / price).toLocaleString(undefined, { maximumFractionDigits: 2 })} $USDBT at today's price)` : ''}.
              Minimum {minConvert.toLocaleString()} points. Payouts are sent in weekly batches.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConvert}
            disabled={converting || currentPoints < minConvert}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-40"
          >
            {converting ? 'Converting…' : 'Convert to $USDBT'}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Clock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <p className="font-semibold">$USDBT has not launched yet, so you cannot receive or use $USDBT today.</p>
            <p className="mt-0.5 text-amber-800">
              Until launch, every reward is paid in points. When $USDBT launches, you can convert your points to $USDBT
              (100 points = $1 of $USDBT at the price when you convert).
            </p>
          </div>
        </div>
      )}
      {notice && (
        <p className={`text-xs font-medium rounded-lg px-3 py-2 ${notice.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{notice.text}</p>
      )}

      {/* Top Banner */}
      <div className="rounded-2xl p-6 text-white bg-gradient-to-r from-[#2b2bf5] via-[#4338ca] to-[#1e1b4b] shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <Trophy size={13} />
              {currentTier} Tier Member
            </div>
            <h1 className="text-2xl font-bold">Rewards</h1>
            <p className="text-xs text-white/80 mt-1 max-w-md">
              Earn points on every gift card, then convert them to $USDBT after launch.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-center min-w-[160px]">
            <span className="text-xs text-white/70 block uppercase font-medium">Available Points</span>
            <span className="text-3xl font-extrabold font-mono tracking-tight">{currentPoints.toLocaleString()}</span>
            <span className="text-[11px] text-white/60 block mt-0.5">
              {launched && price ? `≈ ${(valueUsd / price).toLocaleString(undefined, { maximumFractionDigits: 2 })} $USDBT` : `Worth $${valueUsd.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/15 relative z-10">
          <div className="flex justify-between text-xs text-white/90 mb-1.5 font-medium">
            <span>Progress to Next Tier</span>
            <span>{lifetimePoints.toLocaleString()} / {nextThreshold.toLocaleString()} pts ({progressPct}%)</span>
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
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Sparkles size={16} className="text-[#2b2bf5]" />
            How Rewards Work
          </h3>
          <ul className="text-xs text-gray-600 space-y-2.5">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Earn 1 point per $1 you pay</strong> (more at higher tiers), added when your card is delivered. Up to {(program?.maxPointsPerOrder ?? 500).toLocaleString()} points per order and {(program?.maxPointsPerDay ?? 2000).toLocaleString()} per day.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Refer friends:</strong> earn 1 point per $1 your friends pay on their first order and after.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Convert to $USDBT after launch:</strong> 100 points = $1 of $USDBT at the price when you convert.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <TrendingUp size={16} className="text-[#2b2bf5]" />
            Points Activity
          </h3>
          <div className="space-y-2">
            {(stats?.transactions?.length ?? 0) === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No points yet. Buy a gift card to start earning.</p>
            ) : (
              stats?.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700 font-medium">{ACTION_LABELS[tx.action] ?? tx.action.replace(/_/g, ' ')}</span>
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
