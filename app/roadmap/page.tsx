'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight, CheckCircle2, Clock, Sparkles, Shield,
  CreditCard, Cpu, ArrowUpRight, Zap, RefreshCw,
  ShoppingBag, Bot, Compass, Check, ChevronRight, Menu, X
} from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface Milestone {
  id: string
  phase: string
  quarter: string
  title: string
  status: 'completed' | 'in-progress' | 'upcoming'
  description: string
  deliverables: { text: string; done: boolean }[]
  tags: string[]
  icon: React.ElementType
}

const MILESTONES: Milestone[] = [
  {
    id: 'phase-1',
    phase: 'Phase 01',
    quarter: 'Q1 – Q2 2026',
    title: 'Genesis Settlement & Non-KYC Fulfillment Engine',
    status: 'completed',
    description: 'Constructing the high-speed settlement foundation on Robinhood Chain, linking Paxos USDG directly into global merchant gift card fulfillment via cross-chain intent solvers.',
    deliverables: [
      { text: 'Robinhood Chain (Arbitrum Orbit / Nitro L2, Chain ID 4663) native deployment', done: true },
      { text: 'Dual payment rails: Paxos USDG (0x5fc5...168) and native ETH', done: true },
      { text: 'Relay Link (api.relay.link) cross-chain intent solver to Base (8453) USDC', done: true },
      { text: 'Cryptorefills merchant partner API automation across 480+ digital brands', done: true },
      { text: 'Sign-In with Ethereum (EIP-4361 / SIWE) cryptographic session authentication', done: true },
      { text: 'Resend automated digital delivery with instant email activation codes', done: true },
      { text: 'Desktop wipe-in order panel & mobile drawer checkout flow', done: true },
      { text: '1% protocol fee automated collection to USDBT Treasury', done: true },
    ],
    tags: ['Robinhood Chain', 'Relay Link', 'Base USDC', 'Cryptorefills', 'SIWE'],
    icon: Shield,
  },
  {
    id: 'phase-2',
    phase: 'Phase 02',
    quarter: 'Q3 2026',
    title: 'Conversational AI Commerce & Social Layer',
    status: 'in-progress',
    description: 'Transforming crypto shopping into a conversational interface with an autonomous AI agent, interactive generative widgets, and viral peer-to-peer referral incentives.',
    deliverables: [
      { text: 'Streaming Server-Sent Events (POST /chat) AI shopping agent', done: true },
      { text: 'Generative UI widgets: Brand Carousel, Denomination Picker, Pending Intent Card', done: true },
      { text: 'Zero-trust prompt safety design: AI estimates intent; user signs raw transactions', done: true },
      { text: 'Command Palette (Cmd+K) instant keyboard search and category taxonomy', done: true },
      { text: 'Order timeline tracker with browser notification push alerts', done: true },
      { text: 'Peer-to-peer referral reward mechanics and viral link sharing', done: false },
      { text: 'Multi-currency auto-conversion estimation with slippage guards', done: false },
    ],
    tags: ['AI Agent', 'Gen-UI', 'Streaming SSE', 'Cmd+K', 'Referrals'],
    icon: Bot,
  },
  {
    id: 'phase-3',
    phase: 'Phase 03',
    quarter: 'Q4 2026 – Q1 2027',
    title: 'Non-KYC Virtual Cards & Mobile Tap-to-Pay',
    status: 'upcoming',
    description: 'Expanding beyond prepaid brand vouchers to programmable non-KYC virtual Visa & Mastercard payment cards that can be loaded into Apple Pay and Google Wallet.',
    deliverables: [
      { text: 'Instant virtual Visa & Mastercard creation funded directly with USDG / ETH', done: false },
      { text: 'Apple Pay & Google Wallet NFC contactless provisioning for in-store checkout', done: false },
      { text: 'Single-use disposable "burner" cards for maximum online shopping privacy', done: false },
      { text: 'Dynamic spend limits, merchant category whitelisting, and one-tap card freezing', done: false },
      { text: 'Merchant cashback rewards paid in $USDBT tokens', done: false },
      { text: 'Multi-tier fee discounts based on $USDBT holding tiers', done: false },
    ],
    tags: ['Virtual Cards', 'Apple Pay', 'Google Wallet', 'Burner Cards', 'Cashback'],
    icon: CreditCard,
  },
  {
    id: 'phase-4',
    phase: 'Phase 04',
    quarter: '2027 & Beyond',
    title: 'Multi-Chain Solver Routing & Protocol Decentralization',
    status: 'upcoming',
    description: 'Scaling USDBT into an omnichain commerce protocol with decentralized competitive solver auctions, developer SDKs, and community governance.',
    deliverables: [
      { text: 'Multi-chain settlement expansion (Arbitrum One, Optimism, Polygon, Solana)', done: false },
      { text: 'Decentralized RFQ (Request-for-Quote) solver auction network for zero-slippage fills', done: false },
      { text: 'Headless USDBT Commerce SDK for any dApp to accept crypto-to-gift-card payouts', done: false },
      { text: 'Decentralized protocol governance and community treasury yield distribution', done: false },
      { text: 'Institutional gift card bulk purchasing API with cryptographic escrow', done: false },
    ],
    tags: ['Omnichain', 'RFQ Solvers', 'Developer SDK', 'Governance', 'Decentralization'],
    icon: Cpu,
  },
]

export default function RoadmapPage() {
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'upcoming'>('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const filtered = MILESTONES.filter(m => filter === 'all' || m.status === filter)

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#101126]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg hover:opacity-85 transition-opacity">
            <Image src="/logo.png" alt="USDBT" width={38} height={38} className="rounded-xl shadow-sm" priority />
            <span className="font-bold text-xl text-gray-900 tracking-tight font-display">$USDBT</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-gray-600">
            <Link href="/" className="hover:text-[--color-brand] transition-colors">Home</Link>
            <Link href="/app" className="hover:text-[--color-brand] transition-colors">App</Link>
            <Link href="/assistant" className="hover:text-[--color-brand] transition-colors">AI Assistant</Link>
            <Link href="/roadmap" className="text-[--color-brand] font-semibold">Roadmap</Link>
            <Link href="/whitepaper" className="hover:text-[--color-brand] transition-colors">Whitepaper</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              style={{ backgroundColor: '#2b2bf5', color: '#ffffff' }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#2b2bf5] hover:bg-[#1f1fd8] shadow-sm transition-all"
            >
              <span style={{ color: '#ffffff' }}>Launch App</span>
              <ArrowRight size={15} style={{ color: '#ffffff' }} />
            </Link>
            <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl border border-gray-200 text-gray-600"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-50 w-[80vw] max-w-sm bg-white shadow-2xl flex flex-col p-6 md:hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <span className="font-bold text-gray-900">$USDBT Roadmap</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-gray-400">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <Link href="/" className="block py-1.5 text-gray-700">Home</Link>
                <Link href="/app" className="block py-1.5 text-gray-700">Launch App</Link>
                <Link href="/assistant" className="block py-1.5 text-gray-700">AI Assistant</Link>
                <Link href="/roadmap" className="block py-1.5 text-[--color-brand] font-semibold">Roadmap</Link>
                <Link href="/whitepaper" className="block py-1.5 text-gray-700">Whitepaper</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 bg-gradient-to-b from-white via-white to-[#f8f9fc] border-b border-gray-100">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold font-mono tracking-wider text-[#2b2bf5] bg-[#eef0ff] border border-[#dce0ff] mb-6">
            <Compass size={14} className="text-[#2b2bf5]" />
            USDBT PROTOCOL ROADMAP · 2026–2027
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 font-display mb-6 leading-tight">
            The Blueprint for <span className="text-[--color-brand]">Non-KYC</span><br />Digital Consumer Commerce
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 leading-relaxed mb-10">
            From seamless Paxos USDG settlement on Robinhood Chain to autonomous AI shopping and instant virtual Visa/Mastercard provisioning with Apple Pay.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <span className="text-xs font-mono text-gray-400 block mb-1">SETTLEMENT CHAIN</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 font-display">Robinhood 4663</span>
              <span className="text-xs text-emerald-600 font-medium block mt-1">● Mainnet Live</span>
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <span className="text-xs font-mono text-gray-400 block mb-1">BRAND CATALOG</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 font-display">480+ Brands</span>
              <span className="text-xs text-gray-500 block mt-1">Amazon, Apple, Uber</span>
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <span className="text-xs font-mono text-gray-400 block mb-1">DELIVERY SPEED</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 font-display">&lt; 30 Seconds</span>
              <span className="text-xs text-gray-500 block mt-1">Direct to email inbox</span>
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <span className="text-xs font-mono text-gray-400 block mb-1">SURVEILLANCE</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 font-display">0 KYC</span>
              <span className="text-xs text-indigo-600 font-medium block mt-1">Pure self-custody</span>
            </div>
          </div>
        </div>

        {/* Ambient background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-100/50 to-indigo-100/50 rounded-full blur-3xl -z-10 pointer-events-none" />
      </section>

      {/* Filter Tabs */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2">
            {(['all', 'completed', 'in-progress', 'upcoming'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
                  filter === tab
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                {tab === 'all' ? 'All Phases' : tab.replace('-', ' ')}
              </button>
            ))}
          </div>
          <span className="text-xs font-mono text-gray-400">
            Showing {filtered.length} of {MILESTONES.length} milestones
          </span>
        </div>
      </section>

      {/* Milestones Timeline */}
      <section className="max-w-5xl mx-auto px-6 py-6 space-y-10">
        {filtered.map((milestone) => {
          const Icon = milestone.icon
          const isDone = milestone.status === 'completed'
          const isInProgress = milestone.status === 'in-progress'

          return (
            <div
              key={milestone.id}
              className={`rounded-3xl p-6 sm:p-8 bg-white border transition-all shadow-sm ${
                isInProgress
                  ? 'border-[--color-brand]/40 ring-1 ring-[--color-brand]/10'
                  : isDone
                  ? 'border-emerald-100'
                  : 'border-gray-100'
              }`}
            >
              {/* Header inside milestone */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isDone
                      ? 'bg-emerald-50 text-emerald-600'
                      : isInProgress
                      ? 'bg-[#eef0ff] text-[#2b2bf5]'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold tracking-wider uppercase text-gray-400">{milestone.phase}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs font-medium text-gray-500">{milestone.quarter}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-display mt-0.5">{milestone.title}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isDone ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 size={14} /> COMPLETED & LIVE
                    </span>
                  ) : isInProgress ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#2b2bf5] bg-[#eef0ff] border border-[#cfd6ff] animate-pulse">
                      <RefreshCw size={13} className="animate-spin" /> IN ACTIVE DEVELOPMENT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200">
                      <Clock size={13} /> PLANNED
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed my-6">
                {milestone.description}
              </p>

              {/* Deliverables Checklist */}
              <div className="bg-[#fafbfc] rounded-2xl p-5 border border-gray-100 mb-6">
                <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-gray-500 mb-3">Key Deliverables & Capabilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {milestone.deliverables.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {item.done ? <Check size={12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                      </span>
                      <span className={item.done ? 'text-gray-900 font-medium' : 'text-gray-500'}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Tags */}
              <div className="flex flex-wrap items-center gap-2">
                {milestone.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-lg text-xs font-medium text-gray-600 bg-gray-100">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* Call to Action Card */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-[#1c1cb8] via-[#2b2bf5] to-[#4c4ff5] text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-mono tracking-wider font-semibold text-white/80 block mb-2">EXPERIENCE THE PROTOCOL</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">Start spending your crypto today with zero KYC.</h2>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-8">
              Explore 480+ gift cards across gaming, food, shopping, and travel, or converse directly with our AI assistant to complete purchases on Robinhood Chain.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/app"
                className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-white text-[#2b2bf5] hover:bg-gray-50 shadow-md transition-all inline-flex items-center gap-2"
              >
                Launch App <ArrowRight size={16} />
              </Link>
              <Link
                href="/assistant"
                className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all inline-flex items-center gap-2"
              >
                <Sparkles size={16} /> Try AI Assistant
              </Link>
              <Link
                href="/whitepaper"
                className="px-6 py-3.5 rounded-xl font-semibold text-sm text-white/90 hover:text-white underline underline-offset-4"
              >
                Read Whitepaper
              </Link>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="USDBT" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-gray-900 font-display">$USDBT</span>
            <span className="text-xs text-gray-400">· Non-KYC Consumer Commerce</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link href="/" className="hover:text-[--color-brand] transition-colors">Home</Link>
            <Link href="/app" className="hover:text-[--color-brand] transition-colors">App</Link>
            <Link href="/assistant" className="hover:text-[--color-brand] transition-colors">Assistant</Link>
            <Link href="/roadmap" className="text-[--color-brand] font-semibold">Roadmap</Link>
            <Link href="/whitepaper" className="hover:text-[--color-brand] transition-colors">Whitepaper</Link>
            <a href="https://t.me/usdbt" target="_blank" rel="noopener noreferrer" className="hover:text-[--color-brand] transition-colors">Telegram</a>
          </div>
          <span className="text-xs text-gray-400">Robinhood Chain (Chain ID: 4663)</span>
        </div>
      </footer>
    </div>
  )
}
