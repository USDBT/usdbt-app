'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FileText, ArrowRight, ShieldCheck, Printer, Check, Copy,
  Layers, ArrowUpRight, Cpu, Bot, Lock, Coins, AlertTriangle,
  Menu, X
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const SECTIONS = [
  { id: 'abstract', title: '1. Executive Summary & Abstract' },
  { id: 'architecture', title: '2. Protocol Topology & Hybrid Settlement' },
  { id: 'network', title: '3. Robinhood Chain & USDG Rails' },
  { id: 'solver', title: '4. Relay Cross-Chain Intent Solver Engine' },
  { id: 'ai-commerce', title: '5. Conversational AI Commerce & Gen-UI' },
  { id: 'security', title: '6. Privacy, Non-KYC & EIP-4361 Auth' },
  { id: 'fulfillment', title: '7. Order Lifecycle & Failure Invariants' },
  { id: 'tokenomics', title: '8. $USDBT Tokenomics & Economic Model' },
  { id: 'specs', title: '9. Technical Specification & Contract Matrix' },
  { id: 'disclaimer', title: '10. Legal & Risk Disclosures' },
]

export default function WhitepaperPage() {
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState('abstract')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Track scrolling progress & active section accurately
  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollY / docHeight) * 100)))
      }

      // Check for bottom of page
      if (window.innerHeight + scrollY >= document.documentElement.scrollHeight - 70) {
        setActiveSection(SECTIONS[SECTIONS.length - 1].id)
        return
      }

      const triggerPosition = scrollY + 180
      let current = SECTIONS[0].id

      for (const sec of SECTIONS) {
        const el = document.getElementById(sec.id)
        if (el) {
          const top = el.offsetTop
          if (top <= triggerPosition) {
            current = sec.id
          } else {
            break
          }
        }
      }
      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function handleSectionClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -100
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveSection(id)
    }
  }

  function handleCopyCitation() {
    const citation = `USDBT Protocol Whitepaper: Decentralized Non-KYC Consumer Commerce on Robinhood Chain (v1.0, 2026). https://usdbt.us/whitepaper`
    navigator.clipboard.writeText(citation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-[#111227]">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50 pointer-events-none print:hidden">
        <div
          className="h-full bg-[--color-brand] transition-all duration-100"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg hover:opacity-85 transition-opacity">
            <Image src="/logo.png" alt="USDBT" width={38} height={38} className="rounded-xl shadow-sm" priority />
            <span className="font-bold text-xl text-gray-900 tracking-tight font-display">$USDBT</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-gray-600">
            <Link href="/" className="hover:text-[--color-brand] transition-colors">Home</Link>
            <Link href="/app" className="hover:text-[--color-brand] transition-colors">App</Link>
            <Link href="/assistant" className="hover:text-[--color-brand] transition-colors">AI Assistant</Link>
            <Link href="/roadmap" className="hover:text-[--color-brand] transition-colors">Roadmap</Link>
            <Link href="/whitepaper" className="text-[--color-brand] font-semibold">Whitepaper</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Print or export to PDF"
            >
              <Printer size={14} /> Print / PDF
            </button>
            <Link
              href="/app"
              style={{ backgroundColor: '#2b2bf5', color: '#ffffff' }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#2b2bf5] hover:bg-[#1f1fd8] shadow-sm transition-all"
            >
              <span style={{ color: '#ffffff' }}>Launch App</span>
              <ArrowRight size={15} style={{ color: '#ffffff' }} />
            </Link>
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
                <span className="font-bold text-gray-900">$USDBT Whitepaper</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-gray-400">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <Link href="/" className="block py-1.5 text-gray-700">Home</Link>
                <Link href="/app" className="block py-1.5 text-gray-700">Launch App</Link>
                <Link href="/assistant" className="block py-1.5 text-gray-700">AI Assistant</Link>
                <Link href="/roadmap" className="block py-1.5 text-gray-700">Roadmap</Link>
                <Link href="/whitepaper" className="block py-1.5 text-[--color-brand] font-semibold">Whitepaper</Link>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100">
                <button
                  onClick={handlePrint}
                  className="w-full py-2.5 rounded-xl bg-gray-100 text-xs font-semibold text-gray-700 flex items-center justify-center gap-2"
                >
                  <Printer size={14} /> Print Document
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* Sticky Sidebar Navigation (Desktop) */}
        <aside className="lg:w-72 flex-shrink-0 hidden lg:block print:hidden">
          <div className="sticky top-28 space-y-6">
            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                  TABLE OF CONTENTS
                </span>
                <span className="text-[11px] font-mono text-[--color-brand] font-semibold">
                  {Math.round(scrollProgress)}%
                </span>
              </div>

              <nav className="space-y-1 text-xs font-medium max-h-[calc(100vh-280px)] overflow-y-auto no-scrollbar">
                {SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={(e) => handleSectionClick(e, sec.id)}
                    className={`block px-3 py-2 rounded-lg transition-colors leading-snug ${
                      activeSection === sec.id
                        ? 'bg-[#eef0ff] text-[#2b2bf5] font-semibold border-l-2 border-[#2b2bf5]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 block font-semibold">
                DOCUMENT METADATA
              </span>
              <div className="text-xs space-y-1.5 text-gray-600 font-mono">
                <div><span className="text-gray-400">Version:</span> 1.0 (Final)</div>
                <div><span className="text-gray-400">Release:</span> Sept 2026</div>
                <div><span className="text-gray-400">Network:</span> Robinhood (4663)</div>
                <div><span className="text-gray-400">Settlement:</span> Base USDC (8453)</div>
              </div>
              <button
                onClick={handleCopyCitation}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? 'Citation Copied' : 'Copy Citation'}
              </button>
            </div>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 max-w-4xl space-y-16">
          {/* Document Title Header */}
          <div className="border-b border-gray-200 pb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold font-mono tracking-wider text-[#2b2bf5] bg-[#eef0ff] border border-[#dce0ff] mb-4">
              <FileText size={13} />
              PROTOCOL WHITEPAPER · SPECIFICATION 1.0
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 font-display mb-4 leading-tight">
              USDBT Protocol: Decentralized, Non-KYC Consumer Commerce & Cross-Chain Settlement on Robinhood Chain
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed font-sans">
              A high-throughput, self-custodial commerce rail bridging Paxos USDG liquidity into direct global merchant gift cards and programmable virtual cards without intermediaries or surveillance.
            </p>
            <div className="flex flex-wrap items-center gap-6 mt-6 text-xs font-mono text-gray-500">
              <span>Author: USDBT Core Architecture Team</span>
              <span>·</span>
              <span>License: MIT / Open Source</span>
              <span>·</span>
              <span>Status: Active Mainnet</span>
            </div>
          </div>

          {/* Section 1: Abstract */}
          <section id="abstract" className="scroll-mt-28 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 font-display border-b border-gray-100 pb-2">
              1. Executive Summary & Abstract
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Despite the multi-trillion dollar market capitalization of digital assets, practical day-to-day consumer purchasing remains severely constrained. Users wishing to spend cryptocurrency on everyday necessities—such as groceries, transportation, dining, and software—are forced to navigate centralized off-ramps requiring intrusive Know-Your-Customer (KYC) compliance, prolonged bank transfer settlement delays (2–5 business days), and confiscatory fee structures (3–7%).
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>USDBT</strong> solves this liquidity-to-commerce bottleneck by engineering a native, non-custodial payment pipeline on <strong>Robinhood Chain (Arbitrum Orbit / Nitro L2, Chain ID 4663)</strong>. By integrating native <strong>USDG</strong> (Paxos Global Dollar) and native <strong>ETH</strong> directly with cross-chain intent solvers (Relay Link) and automated global merchant fulfillment (Cryptorefills), USDBT enables instant (&lt;30s), private digital gift card delivery to user inboxes for over 480 tier-one brands including Amazon, Apple, Uber, Steam, Airbnb, DoorDash, and Netflix.
            </p>
            <div className="bg-[#f0f4ff] border-l-4 border-[#2b2bf5] p-4 rounded-r-xl">
              <p className="text-xs sm:text-sm text-[#1b1c6e] font-medium leading-relaxed">
                <strong>Core Invariant:</strong> The user retains total custody of their private keys at all times. Neither the web frontend, the backend poller, nor the autonomous AI shopping assistant ever possesses the authority to sign transactions or hold user balances.
              </p>
            </div>
          </section>

          {/* Section 2: Topology */}
          <section id="architecture" className="scroll-mt-28 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 font-display border-b border-gray-100 pb-2">
              2. Protocol Topology & Hybrid Settlement
            </h2>
            <p className="text-gray-700 leading-relaxed">
              The USDBT protocol operates across a high-speed three-tier architecture: the Client Presentation Layer, the Intent & Settlement Layer, and the Merchant Fulfillment Layer.
            </p>

            {/* Architecture Table */}
            <div className="overflow-x-auto my-6 no-scrollbar">
              <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-100 font-mono text-gray-700 uppercase">
                  <tr>
                    <th className="p-3 border-b">Layer</th>
                    <th className="p-3 border-b">Technology / Component</th>
                    <th className="p-3 border-b">Responsibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  <tr>
                    <td className="p-3 font-semibold text-gray-900">Presentation</td>
                    <td className="p-3 font-mono">Next.js 15, Wagmi v2, RainbowKit</td>
                    <td className="p-3 text-gray-600">Client UI, SIWE authentication, wallet transaction signing</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-900">Execution</td>
                    <td className="p-3 font-mono">Bun, Express, TypeScript, Supabase</td>
                    <td className="p-3 text-gray-600">Quoting engine, SSE AI streaming, order status poller</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-900">Cross-Chain Solver</td>
                    <td className="p-3 font-mono">Relay Link (api.relay.link)</td>
                    <td className="p-3 text-gray-600">Bridges Robinhood USDG/ETH (4663) to exact Base USDC (8453)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-900">Fulfillment</td>
                    <td className="p-3 font-mono">Cryptorefills Partner API, Resend</td>
                    <td className="p-3 text-gray-600">Voucher issuance, digital code generation, instant email delivery</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-700 leading-relaxed">
              When an order is created, the solver guarantees atomic execution. In the event of a downstream merchant error, the protocol automatically flags the transaction for complete refund to the user&apos;s originating address.
            </p>
          </section>

          {/* Section 3: Robinhood Chain & USDG */}
          <section id="network" className="scroll-mt-28 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 font-display border-b border-gray-100 pb-2">
              3. Robinhood Chain & USDG Rails
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Robinhood Chain (Chain ID: <code>4663</code>) is an Arbitrum Orbit Nitro L2 offering sub-second block confirmation times and micro-cent transaction fees (&lt;$0.001 per transaction).
            </p>
            <p className="text-gray-700 leading-relaxed">
              The primary settlement currency of USDBT is <strong>USDG</strong>, issued by Paxos. Unlike algorithmic or undercollateralized stablecoins, USDG is fully backed 1:1 by high-quality US dollar cash equivalents, offering superior price stability and institutional regulatory backing.
            </p>
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 font-mono text-xs space-y-2">
              <div className="text-gray-500">// Verified Robinhood Chain Parameters</div>
              <div><span className="text-indigo-600 font-semibold">ROBINHOOD_CHAIN_ID</span> = 4663</div>
              <div><span className="text-indigo-600 font-semibold">ROBINHOOD_USDG_TOKEN</span> = 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168 (6 decimals)</div>
              <div><span className="text-indigo-600 font-semibold">ROBINHOOD_RPC_URL</span> = https://rpc.mainnet.chain.robinhood.com</div>
              <div><span className="text-indigo-600 font-semibold">BLOCK_EXPLORER</span> = https://robinhoodchain.blockscout.com</div>
            </div>
          </section>

          {/* Section 4: Relay Solver */}
          <section id="solver" className="scroll-mt-28 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 font-display border-b border-gray-100 pb-2">
              4. Relay Cross-Chain Intent Solver Engine
            </h2>
            <p className="text-gray-700 leading-relaxed">
              A core innovation of USDBT is the abstraction of merchant-specific deposit chains. Cryptorefills requires settlement in exact USDC on <strong>Base (Chain ID 8453)</strong>. Requiring users to bridge funds manually to Base would impose severe friction, cognitive overhead, and multi-network gas requirements.
            </p>
            <p className="text-gray-700 leading-relaxed">
              USDBT integrates the <strong>Relay Link</strong> intent protocol. When a purchase is initialized:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700 text-sm">
              <li>The backend requests a cryptographically signed quote from Relay linking the user&apos;s Robinhood Chain USDG/ETH to the merchant&apos;s Base USDC deposit address.</li>
              <li>A <strong>1.0% platform fee</strong> is programmatically appended to the solver transaction steps, routing fee revenue directly to the USDBT Treasury address (<code>0x6bcB...ac47</code>).</li>
              <li>The user signs a single transaction on Robinhood Chain. Relay&apos;s off-chain solvers immediately fill the order on Base, settling Cryptorefills within 2–4 seconds.</li>
            </ol>
          </section>

          {/* Section 5: AI Commerce */}
          <section id="ai-commerce" className="scroll-mt-28 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 font-display border-b border-gray-100 pb-2">
              5. Conversational AI Commerce & Gen-UI Protocol
            </h2>
            <p className="text-gray-700 leading-relaxed">
              USDBT pioneers conversational consumer spending through an integrated AI Shopping Agent exposed via Server-Sent Events (SSE) at <code>POST /chat</code>.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Unlike traditional text-only LLMs that require manual copy-pasting of product identifiers, USDBT streams <strong>Generative UI (Gen-UI)</strong> widgets directly into the conversational interface:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700 text-sm">
              <li><code>brand_carousel</code>: Interactive horizontal brand cards filtered by intent.</li>
              <li><code>denomination_picker</code>: Fixed denomination chips ($25, $50, $100, etc.) or custom variable amounts.</li>
              <li><code>order_intent</code>: Interactive review card showing real-time price estimation in USDG or ETH.</li>
              <li><code>order_status</code>: Live status stepper reporting fulfillment progress in the chat window.</li>
            </ul>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
              <p className="text-xs sm:text-sm text-amber-900 font-medium leading-relaxed">
                <strong>Security Guardrail:</strong> The AI Agent never receives or processes executable transaction calldata. It only outputs non-binding estimates. When the user confirms, the standard <code>POST /orders</code> pipeline is invoked, requiring explicit local signature from the user&apos;s wallet.
              </p>
            </div>
          </section>

          {/* Section 6: Security & Privacy */}
          <section id="security" className="scroll-mt-28 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 font-display border-b border-gray-100 pb-2">
              6. Privacy, Non-KYC Paradigm & EIP-4361 Auth
            </h2>
            <p className="text-gray-700 leading-relaxed">
              USDBT enforces strict data minimization. The protocol holds zero personal identifiable information (PII):
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700 text-sm">
              <li><strong>Zero KYC Verification:</strong> No identity cards, passports, phone numbers, or residential proofs are required or requested.</li>
              <li><strong>EIP-4361 Cryptographic Handshake:</strong> Users authenticate by signing a cryptographically non-transferable Sign-In with Ethereum (SIWE) nonce. Session tokens are signed via HMAC SHA-256 JWTs and expire automatically.</li>
              <li><strong>Ephemeral Data Handling:</strong> Recipient emails provided during checkout are strictly utilized by the Resend transactional dispatch engine to deliver voucher PINs and gift links, after which order records are pseudonymous.</li>
            </ul>
          </section>

          {/* Section 7: Fulfillment */}
          <section id="fulfillment" className="scroll-mt-28 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 font-display border-b border-gray-100 pb-2">
              7. Order Lifecycle & Failure Invariants
            </h2>
            <p className="text-gray-700 leading-relaxed">
              An order undergoes a deterministic 5-stage lifecycle state machine:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs font-mono my-4">
              <div className="p-3 bg-gray-100 rounded-xl">1. Created</div>
              <div className="p-3 bg-blue-50 text-blue-700 font-semibold rounded-xl">2. Quoted</div>
              <div className="p-3 bg-indigo-50 text-indigo-700 font-semibold rounded-xl">3. Solved</div>
              <div className="p-3 bg-purple-50 text-purple-700 font-semibold rounded-xl">4. Issued</div>
              <div className="p-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl">5. Delivered</div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              If upstream fulfillment partner inventory is exhausted or the merchant fails to issue a gift card code within the SLA window (300 seconds), the order transitions to <code>refunded</code>, and the solver issues full restitution to the payer address.
            </p>
          </section>

          {/* Section 8: Tokenomics */}
          <section id="tokenomics" className="scroll-mt-28 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 font-display border-b border-gray-100 pb-2">
              8. $USDBT Tokenomics & Economic Model
            </h2>
            <p className="text-gray-700 leading-relaxed">
              The <strong>$USDBT</strong> token serves as the core incentive alignment and governance asset within the USDBT ecosystem:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <span className="w-8 h-8 rounded-lg bg-[#eef0ff] text-[#2b2bf5] flex items-center justify-center mb-3">
                  <Coins size={18} />
                </span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Fee Rebates</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Holders of $USDBT qualify for tiered platform fee reductions from 1.0% down to 0.25% based on holding brackets.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <span className="w-8 h-8 rounded-lg bg-[#eef0ff] text-[#2b2bf5] flex items-center justify-center mb-3">
                  <ShieldCheck size={18} />
                </span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Cashback & Rewards</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Every card purchase awards dynamic cashback paid directly in $USDBT, distributing protocol value to frequent shoppers.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <span className="w-8 h-8 rounded-lg bg-[#eef0ff] text-[#2b2bf5] flex items-center justify-center mb-3">
                  <Layers size={18} />
                </span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">DAO Governance</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Community voting rights on treasury allocations, merchant catalog additions, and cross-chain solver expansions.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Technical Specifications */}
          <section id="specs" className="scroll-mt-28 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 font-display border-b border-gray-100 pb-2">
              9. Technical Specification & Contract Matrix
            </h2>
            <div className="overflow-x-auto my-4 no-scrollbar">
              <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden font-mono">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 border-b">Parameter</th>
                    <th className="p-3 border-b">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Robinhood Chain ID</td>
                    <td className="p-3 text-indigo-600 font-bold">4663 (EVM Orbit Nitro)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Paxos USDG Contract</td>
                    <td className="p-3">0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">USDBT Treasury Wallet</td>
                    <td className="p-3">0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Base Settlement Chain ID</td>
                    <td className="p-3">8453 (OP Stack L2)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Base USDC Contract</td>
                    <td className="p-3">0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Relay Solver API</td>
                    <td className="p-3">https://api.relay.link</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Production API Host</td>
                    <td className="p-3">https://usdbt-api.onrender.com</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 10: Disclaimer */}
          <section id="disclaimer" className="scroll-mt-28 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 font-display border-b border-gray-100 pb-2">
              10. Legal & Risk Disclosures
            </h2>
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle size={16} className="text-amber-600" />
                DISCLAIMER & REGULATORY NOTICE
              </div>
              <p>
                The information provided in this Whitepaper is for technical descriptive purposes only and does not constitute an offer of securities, financial promotion, investment advice, or solicitation in any jurisdiction.
              </p>
              <p>
                Digital gift cards purchased through USDBT are subject to individual merchant issuer redemption terms and conditions. USDBT operates non-custodial software routing on decentralized public blockchains and does not serve as a bank, custodian, or money transmitter.
              </p>
            </div>
          </section>

          {/* Navigation Bottom CTA */}
          <div className="pt-10 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <Link
              href="/roadmap"
              className="text-xs font-semibold text-gray-600 hover:text-[--color-brand] transition-colors"
            >
              ← View Protocol Roadmap
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/assistant"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center gap-1.5"
              >
                <Bot size={14} /> Try AI Assistant
              </Link>
              <Link
                href="/app"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[--color-brand] hover:bg-[--color-brand-hover] shadow-sm transition-all inline-flex items-center gap-1.5"
              >
                Launch App <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 px-6 print:hidden">
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
            <Link href="/roadmap" className="hover:text-[--color-brand] transition-colors">Roadmap</Link>
            <Link href="/whitepaper" className="text-[--color-brand] font-semibold">Whitepaper</Link>
          </div>
          <span className="text-xs text-gray-400">Robinhood Chain (Chain ID: 4663)</span>
        </div>
      </footer>
    </div>
  )
}
