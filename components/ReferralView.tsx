'use client'

import { useState, useEffect } from 'react'
import { Users, Copy, Check, Gift, ArrowRight, Share2, DollarSign } from 'lucide-react'
import { getReferralStats, claimReferralRewards, type ReferralStats } from '@/lib/api'
import QRCode from 'react-qr-code'

export function ReferralView({ address }: { address?: string }) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }
    getReferralStats(address)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [address])

  function copyLink() {
    if (!stats?.referralLink) return
    navigator.clipboard.writeText(stats.referralLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  function copyCode() {
    if (!stats?.referralCode) return
    navigator.clipboard.writeText(stats.referralCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  async function handleClaim() {
    if (!address) return
    setClaiming(true)
    try {
      await claimReferralRewards(address)
      setClaimSuccess(true)
      if (stats) setStats({ ...stats, claimableUsd: 0 })
      setTimeout(() => setClaimSuccess(false), 3000)
    } catch {
      alert('Could not claim rewards')
    } finally {
      setClaiming(false)
    }
  }

  const referralCode = stats?.referralCode ?? (address ? `REF-${address.slice(2, 8).toUpperCase()}` : 'REF-CONNECT')
  const referralLink = stats?.referralLink ?? `https://usdbt.us/app?ref=${referralCode}`

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-br from-[#2b2bf5] to-[#1818a6] rounded-2xl p-6 text-white shadow-xs">
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold mb-2">
          <Gift size={13} />
          Referral Rewards Program
        </div>
        <h1 className="text-2xl font-bold">Invite Friends, Earn Crypto Cashback</h1>
        <p className="text-xs text-white/80 mt-1 max-w-lg">
          Give your friends 2% off their gift cards. You earn 1.5% perpetual cashback on every purchase they make!
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-400 font-medium">Referred Friends</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalReferred ?? 0}</p>
          <span className="text-[11px] text-gray-400">Total signups using your code</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-400 font-medium">Total Rewards Earned</span>
          <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">${(stats?.totalRewardsUsd ?? 0).toFixed(2)}</p>
          <span className="text-[11px] text-gray-400">Paid out in USDC / USDG</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium">Claimable Rewards</span>
            <p className="text-2xl font-bold text-gray-900 font-mono mt-1">${(stats?.claimableUsd ?? 0).toFixed(2)}</p>
          </div>
          <button
            onClick={handleClaim}
            disabled={claiming || (stats?.claimableUsd ?? 0) <= 0}
            className="mt-2 w-full py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-40"
          >
            {claimSuccess ? 'Claimed! ✓' : claiming ? 'Claiming…' : 'Claim to Wallet'}
          </button>
        </div>
      </div>

      {/* Share Box & QR Code */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-800 uppercase block mb-1.5">Your Referral Link</label>
            <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <span className="text-xs font-mono text-gray-700 flex-1 truncate">{referralLink}</span>
              <button
                type="button"
                onClick={copyLink}
                className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-800 uppercase block mb-1.5">Your Referral Code</label>
            <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <span className="text-xs font-mono font-bold text-[#2b2bf5] flex-1">{referralCode}</span>
              <button
                type="button"
                onClick={copyCode}
                className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Buy gift cards with crypto on @USDBT with 2% off! Use my referral link: ${referralLink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              Share on X
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Buy non-KYC gift cards with crypto!')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#229ed9] text-white text-xs font-medium hover:bg-[#1f8ec4] transition-colors"
            >
              Telegram
            </a>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-100">
          <QRCode value={referralLink} size={110} />
          <span className="text-[10px] text-gray-400 mt-2">Scan to join with referral</span>
        </div>
      </div>

      {/* Recent Referrals Table */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
        <h3 className="text-xs font-bold text-gray-800 mb-3">Recent Referrals</h3>
        {(stats?.recentReferrals?.length ?? 0) === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">No friends referred yet. Share your link to start earning!</p>
        ) : (
          <div className="space-y-2">
            {stats?.recentReferrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <span className="font-mono text-gray-700">{r.referredWallet}</span>
                <span className="font-mono font-bold text-emerald-600">+${r.rewardAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
