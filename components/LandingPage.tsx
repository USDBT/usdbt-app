'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown, ArrowRight, Check, CreditCard, Gift, ShieldCheck,
  Sparkles, Wallet, Menu, X, ShoppingBag, Compass, FileText,
  HelpCircle, ExternalLink
} from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import type { Product } from '@/lib/api'

function BrandMark({ product }: { product: Product }) {
  return (
    <div className="landing-brand-mark">
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image} alt="" />
      ) : <span>{product.name.slice(0, 1)}</span>}
    </div>
  )
}

export function LandingPage({ products, onShop }: { products: Product[]; onShop?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const featured = products.slice(0, 4)

  return (
    <main className="landing-page relative overflow-x-hidden">
      {/* Navigation Header */}
      <header className="landing-nav">
        <Link href="/" className="landing-wordmark" aria-label="$USDBT home">
          <Image src="/logo.png" alt="" width={36} height={36} className="rounded-xl" priority />
          <span>$USDBT</span>
        </Link>

        {/* Minimal Right Actions: Launch App CTA + Hamburger */}
        <div className="flex items-center gap-3 ml-auto">
          {onShop ? (
            <button
              onClick={onShop}
              style={{ backgroundColor: '#2b2bf5', color: '#ffffff' }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#2b2bf5] hover:bg-[#1f1fd8] shadow-sm transition-all cursor-pointer"
            >
              <span style={{ color: '#ffffff' }}>Launch App</span>
              <ArrowRight size={14} style={{ color: '#ffffff' }} />
            </button>
          ) : (
            <Link
              href="/app"
              style={{ backgroundColor: '#2b2bf5', color: '#ffffff' }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#2b2bf5] hover:bg-[#1f1fd8] shadow-sm transition-all cursor-pointer"
            >
              <span style={{ color: '#ffffff' }}>Launch App</span>
              <ArrowRight size={14} style={{ color: '#ffffff' }} />
            </Link>
          )}

          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-xs flex items-center justify-center"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* 40% Screen Slide-in Drawer from the Right */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              key="landing-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            />

            {/* Drawer: 40% width on desktop, 85% on mobile */}
            <motion.div
              key="landing-menu-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-50 w-[85vw] sm:w-[40vw] sm:min-w-[340px] sm:max-w-[480px] bg-white shadow-2xl flex flex-col overflow-hidden border-l border-gray-100"
            >
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg shadow-xs" />
                  <div>
                    <span className="font-bold text-gray-900 font-display block leading-none">$USDBT</span>
                    <span className="text-[10px] text-gray-400 font-mono tracking-wider">ROBINHOOD CHAIN</span>
                  </div>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Action Links */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3 no-scrollbar">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold block mb-2">
                  NAVIGATION & PROTOCOL
                </span>

                <Link
                  href="/app"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-[#eef0ff] hover:border-[#cfd6ff] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-[#2b2bf5] group-hover:bg-[#2b2bf5] group-hover:text-white transition-colors">
                    <ShoppingBag size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">Launch App</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-emerald-100 text-emerald-700 font-bold">Mainnet</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">Shop 480+ gift cards with USDG or ETH</p>
                  </div>
                  <ArrowRight size={15} className="text-gray-400 group-hover:text-[#2b2bf5] group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/assistant"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-[#eef0ff] hover:border-[#cfd6ff] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-[#2b2bf5] group-hover:bg-[#2b2bf5] group-hover:text-white transition-colors">
                    <Sparkles size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">AI Assistant</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-[#eef0ff] text-[#2b2bf5] font-bold">Live</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">Conversational shopping & instant quotes</p>
                  </div>
                  <ArrowRight size={15} className="text-gray-400 group-hover:text-[#2b2bf5] group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/roadmap"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-[#eef0ff] hover:border-[#cfd6ff] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-gray-700 group-hover:bg-[#2b2bf5] group-hover:text-white transition-colors">
                    <Compass size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 block">Protocol Roadmap</span>
                    <p className="text-xs text-gray-500 truncate">2026–2027 milestones & virtual cards</p>
                  </div>
                  <ArrowRight size={15} className="text-gray-400 group-hover:text-[#2b2bf5] group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/whitepaper"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-[#eef0ff] hover:border-[#cfd6ff] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-gray-700 group-hover:bg-[#2b2bf5] group-hover:text-white transition-colors">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 block">Technical Whitepaper</span>
                    <p className="text-xs text-gray-500 truncate">Architecture, solver & tokenomics v1.0</p>
                  </div>
                  <ArrowRight size={15} className="text-gray-400 group-hover:text-[#2b2bf5] group-hover:translate-x-0.5 transition-all" />
                </Link>

                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold block pt-4 mb-2">
                  ABOUT USDBT
                </span>

                <a
                  href="#how-it-works"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
                >
                  <CreditCard size={16} className="text-gray-400" />
                  How it works
                </a>

                <a
                  href="#why-usdbt"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
                >
                  <ShieldCheck size={16} className="text-gray-400" />
                  Why USDBT (Zero KYC)
                </a>

                <a
                  href="https://t.me/usdbt"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle size={16} className="text-gray-400" />
                    Community & Support
                  </div>
                  <ExternalLink size={13} className="text-gray-400" />
                </a>
              </div>

              {/* Drawer Bottom Wallet & Status (No switch network clutter) */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/70 space-y-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Wallet</span>
                  <ConnectButton accountStatus="avatar" showBalance={false} chainStatus="none" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 font-mono">
                  <span>Robinhood Chain (4663)</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Operational
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="home" className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow">
            <span /> DIGITAL GIFTS, SIMPLIFIED
            <Link
              href="/assistant"
              className="ml-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-normal text-[#2b2bf5] bg-[#eef0ff] hover:bg-[#e0e4ff] transition-colors"
            >
              <Sparkles size={12} /> AI Shopping Assistant
            </Link>
          </div>
          <h1>Your crypto.<br />Their <span>next favorite</span><br className="landing-title-break" /> thing.</h1>
          <p className="landing-hero-description">Send a little joy, straight from your wallet. Shop gift cards from the brands you love and pay with crypto on Robinhood Chain.</p>
          <div className="landing-hero-actions">
            {onShop ? (
              <button className="landing-primary" onClick={onShop}>Explore gift cards <ArrowRight size={17} /></button>
            ) : (
              <Link href="/app" className="landing-primary">Explore gift cards <ArrowRight size={17} /></Link>
            )}
            <Link href="/assistant" className="landing-secondary font-medium hover:text-[#2b2bf5] transition-colors">
              <span className="landing-play"><Sparkles size={13} /></span> Try AI Assistant
            </Link>
          </div>
          <div className="landing-proof"><span className="landing-proof-icon"><ShieldCheck size={16} /></span><span><strong>Simple by design.</strong> Delivered directly to your inbox. No KYC.</span></div>
        </div>

        <div className="landing-hero-art" aria-label="A digital gift card ready to share">
          <div className="landing-art-orbit landing-art-orbit-one" />
          <div className="landing-art-orbit landing-art-orbit-two" />
          <div className="landing-art-note"><span className="landing-note-dot" /> A little something for you</div>
          <div className="landing-gift-card">
            <div className="landing-card-top"><span className="landing-card-brand">$USDBT</span><span className="landing-card-chip"><CreditCard size={19} /></span></div>
            <div className="landing-card-gift"><Gift size={23} strokeWidth={1.5} /></div>
            <div className="landing-card-caption">GOOD THINGS, ON DEMAND</div>
            <div className="landing-card-bottom"><span>YOUR NEXT<br />FAVORITE THING.</span><span className="landing-card-sparkle">✳</span></div>
          </div>
          <div className="landing-delivered"><span className="landing-delivered-icon"><Check size={17} /></span><span><strong>Ready when they are</strong><small>Sent straight to their inbox</small></span></div>
          <div className="landing-card-orbit-dot" />
        </div>
        <a href="#brands" className="landing-scroll-cue" aria-label="Scroll to popular brands"><span>SCROLL TO DISCOVER</span><ArrowDown size={13} /></a>
      </section>

      {/* Brands Section */}
      <section id="brands" className="landing-brands">
        <p>ONE WALLET. MANY WAYS TO MAKE SOMEONE’S DAY.</p>
        <div className="landing-brand-row">
          {featured.length ? featured.map((product) => <div className="landing-brand-item" key={product.id}><BrandMark product={product} /><span>{product.name}</span></div>) : <span className="landing-brand-placeholder">Your favorite brands, all in one place</span>}
          {onShop ? (
            <button className="landing-brand-more" onClick={onShop}>Explore all cards <ArrowRight size={15} /></button>
          ) : (
            <Link href="/app" className="landing-brand-more">Explore all cards <ArrowRight size={15} /></Link>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="landing-how">
        <div className="landing-section-intro">
          <span className="landing-section-kicker">A BETTER WAY TO GIFT</span>
          <h2>Good gifting.<br /><span>Made simple.</span></h2>
          <p>Skip the guesswork. Choose a card, check out with crypto, and let the good surprise do the rest.</p>
        </div>
        <div className="landing-steps">
          <article><span className="landing-step-number">01</span><span className="landing-step-icon"><CreditCard size={19} /></span><h3>Find their thing</h3><p>Browse hundreds of gift cards across entertainment, food, shopping and more.</p><span className="landing-step-rule" /></article>
          <article><span className="landing-step-number">02</span><span className="landing-step-icon"><Wallet size={19} /></span><h3>Pay your way</h3><p>Connect your wallet and pay securely with USDG or ETH on Robinhood Chain.</p><span className="landing-step-rule" /></article>
          <article><span className="landing-step-number">03</span><span className="landing-step-icon"><Gift size={19} /></span><h3>Make their day</h3><p>The digital gift card is delivered to your email, ready to share and enjoy.</p><span className="landing-step-rule" /></article>
        </div>
      </section>

      {/* Why USDBT */}
      <section id="why-usdbt" className="landing-closer">
        <div><span className="landing-section-kicker">A LITTLE MORE THOUGHTFUL</span><h2>Crypto is better<br />when it feels <span>personal.</span></h2></div>
        <div className="landing-closer-action">
          <p>Make someone’s day in a few clicks. No paperwork. Just a gift that feels like them.</p>
          {onShop ? (
            <button className="landing-primary" onClick={onShop}>Find their favorite <ArrowRight size={17} /></button>
          ) : (
            <Link href="/app" className="landing-primary">Find their favorite <ArrowRight size={17} /></Link>
          )}
        </div>
        <div className="landing-closer-stamp"><Gift size={19} /><span>GOOD THINGS<br />ARE HERE</span></div>
      </section>

      {/* Footer */}
      <footer className="landing-footer flex flex-col sm:flex-row items-center justify-between gap-4 py-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="landing-wordmark"><Image src="/logo.png" alt="" width={28} height={28} className="rounded-lg" /><span>$USDBT</span></Link>
          <span className="text-xs text-gray-500">Digital gifting, with a little more heart.</span>
        </div>
        <div className="flex items-center gap-5 text-xs text-gray-500">
          <Link href="/app" className="hover:text-[--color-brand] transition-colors">App</Link>
          <Link href="/assistant" className="hover:text-[--color-brand] transition-colors">AI Assistant</Link>
          <Link href="/roadmap" className="hover:text-[--color-brand] transition-colors">Roadmap</Link>
          <Link href="/whitepaper" className="hover:text-[--color-brand] transition-colors">Whitepaper</Link>
          <span>Robinhood Chain (4663)</span>
        </div>
      </footer>
    </main>
  )
}
