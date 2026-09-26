'use client'

import { useState, useEffect } from 'react'
import { Store, Key, Copy, Check, Code, ShoppingBag, ArrowUpRight, ShieldCheck, Terminal } from 'lucide-react'
import { registerMerchant, getMerchantProfile, type MerchantProfile, type MerchantOrder } from '@/lib/api'

export function MerchantView({ address }: { address?: string }) {
  const [merchantName, setMerchantName] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<MerchantProfile | null>(null)
  const [orders, setOrders] = useState<MerchantOrder[]>([])
  const [copiedKey, setCopiedKey] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'api-docs' | 'orders'>('overview')

  // Check if API key is stored in localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('usdbt_merchant_key')
    if (savedKey) {
      getMerchantProfile(savedKey)
        .then((data) => {
          setProfile(data.merchant)
          setOrders(data.orders)
        })
        .catch(() => localStorage.removeItem('usdbt_merchant_key'))
    }
  }, [])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!address || !merchantName.trim()) return
    setLoading(true)
    try {
      const res = await registerMerchant(address, merchantName.trim(), webhookUrl.trim() || undefined)
      setProfile(res.merchant)
      localStorage.setItem('usdbt_merchant_key', res.merchant.apiKey)
    } catch {
      alert('Could not register merchant account')
    } finally {
      setLoading(false)
    }
  }

  function copyApiKey() {
    if (!profile?.apiKey) return
    navigator.clipboard.writeText(profile.apiKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-[#eef0ff] text-[#2b2bf5] px-2.5 py-1 rounded-full text-xs font-semibold mb-2">
            <Store size={13} />
            USDBT Merchant API
          </div>
          <h1 className="text-xl font-bold text-gray-900">Sell Gift Cards Directly Through Your App</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-lg">
            Integrate our programmatic gift card API. Issue Amazon, Apple, Uber, and 500+ top brand cards directly with 2.5% wholesale margins.
          </p>
        </div>

        {profile && (
          <div className="flex gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Total Volume</span>
              <p className="text-lg font-bold font-mono text-gray-800">${profile.totalVolume.toFixed(2)}</p>
            </div>
            <div className="border-l border-gray-200 pl-4">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Orders Sold</span>
              <p className="text-lg font-bold font-mono text-gray-800">{orders.length}</p>
            </div>
          </div>
        )}
      </div>

      {!profile ? (
        /* Merchant Registration Form */
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs max-w-md mx-auto">
          <div className="w-10 h-10 rounded-xl bg-[#eef0ff] flex items-center justify-center mb-3">
            <Key size={18} className="text-[#2b2bf5]" />
          </div>
          <h2 className="text-base font-bold text-gray-900">Create Merchant Account</h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">
            Generate an API key to sell digital gift cards on your website, Discord bot, or store.
          </p>

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Business / Store Name</label>
              <input
                type="text"
                placeholder="e.g. Acme Crypto Store"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                required
                className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Webhook URL (Optional)</label>
              <input
                type="url"
                placeholder="https://yourstore.com/api/webhooks"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !address}
              className="w-full py-2.5 bg-[#2b2bf5] text-white rounded-xl text-xs font-semibold hover:bg-[#1f1fd8] transition-colors disabled:opacity-50"
            >
              {loading ? 'Generating API Key…' : 'Generate Merchant API Key'}
            </button>
            {!address && (
              <p className="text-[11px] text-amber-600 text-center">Connect your wallet first to register.</p>
            )}
          </form>
        </div>
      ) : (
        /* Merchant Dashboard */
        <div className="space-y-4">
          {/* API Key Box */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Key size={14} className="text-[#2b2bf5]" />
                Live API Key ({profile.name})
              </span>
              <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Active</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <code className="text-xs font-mono text-gray-700 flex-1 truncate">{profile.apiKey}</code>
              <button
                type="button"
                onClick={copyApiKey}
                className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {copiedKey ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200">
            {(['overview', 'api-docs', 'orders'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-4 text-xs font-semibold capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#2b2bf5] text-[#2b2bf5]'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <span className="text-xs text-gray-400 font-medium">Wholesale Discount</span>
                <p className="text-lg font-bold text-emerald-600 mt-1">2.5% Margin</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Applied to all programmatic sales</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <span className="text-xs text-gray-400 font-medium">Settlement Speed</span>
                <p className="text-lg font-bold text-gray-900 mt-1">&lt; 5 Seconds</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Instant automated code delivery</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <span className="text-xs text-gray-400 font-medium">Supported Brands</span>
                <p className="text-lg font-bold text-[#2b2bf5] mt-1">500+ Top Brands</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Global digital catalog</p>
              </div>
            </div>
          )}

          {activeTab === 'api-docs' && (
            <div className="bg-gray-900 rounded-2xl p-5 text-gray-200 font-mono text-xs space-y-4">
              <div className="flex items-center justify-between text-gray-400 border-b border-gray-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <Terminal size={13} className="text-[#2b2bf5]" />
                  cURL Example: Issue Gift Card
                </span>
                <span>POST /api/merchant/orders</span>
              </div>
              <pre className="overflow-x-auto text-[11px] text-emerald-400">
{`curl -X POST https://usdbt.us/api/merchant/orders \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${profile.apiKey}" \\
  -d '{
    "productId": "amazon",
    "brandName": "Amazon",
    "faceValue": 50,
    "recipientEmail": "customer@example.com",
    "externalRef": "ORDER-98124"
  }'`}
              </pre>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs">
              <h3 className="text-xs font-bold text-gray-900 mb-3">Merchant Sales History</h3>
              {orders.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No merchant orders placed yet.</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-50 bg-gray-50 text-xs">
                      <div>
                        <p className="font-semibold text-gray-800">{o.brand_name} · ${o.face_value}</p>
                        <p className="text-[10px] text-gray-400">Ref: {o.external_ref || o.id} · To: {o.recipient_email}</p>
                      </div>
                      <span className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">
                        {o.card_code || 'DELIVERED'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
