'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useMotionTemplate, useSpring, useTransform } from 'framer-motion'
import { Palette, Wifi, Store, ScrollText, ArrowDownToLine } from 'lucide-react'

const DESIGN_KEY = 'usdbt_card_design'

type Tone = 'light' | 'dark'

interface Pattern {
  id: string
  label: string
  fg: string
  tone: Tone
  swatch: React.CSSProperties
  layers: React.ReactNode  // absolutely-positioned background layers
}

// ── EMV chip (realistic contact pads) ──────────────────────────────────────────
function Chip() {
  return (
    <svg width="44" height="34" viewBox="0 0 44 34" fill="none" className="drop-shadow-sm">
      <defs>
        <linearGradient id="chipg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6e6a8" />
          <stop offset="45%" stopColor="#d9b85c" />
          <stop offset="55%" stopColor="#c9a347" />
          <stop offset="100%" stopColor="#e8d18a" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="43" height="33" rx="5" fill="url(#chipg)" stroke="rgba(0,0,0,0.15)" />
      {/* contact pad lines */}
      <g stroke="rgba(120,90,20,0.55)" strokeWidth="1">
        <line x1="0" y1="11" x2="44" y2="11" />
        <line x1="0" y1="22" x2="44" y2="22" />
        <line x1="15" y1="0" x2="15" y2="11" />
        <line x1="29" y1="0" x2="29" y2="11" />
        <line x1="15" y1="22" x2="15" y2="34" />
        <line x1="29" y1="22" x2="29" y2="34" />
        <rect x="15" y="11" width="14" height="11" fill="none" />
      </g>
    </svg>
  )
}

// ── Network marks ───────────────────────────────────────────────────────────────
function NetworkLogos({ tone }: { tone: Tone }) {
  const c = tone === 'light' ? '#fff' : '#1e1b4b'
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[15px] font-bold italic tracking-tighter" style={{ color: c, fontFamily: 'Georgia, "Times New Roman", serif', textShadow: tone === 'light' ? '0 1px 2px rgba(0,0,0,0.35)' : 'none' }}>
        VISA
      </span>
      <span className="relative inline-flex items-center" aria-label="Mastercard">
        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#eb001b' }} />
        <span className="w-4 h-4 rounded-full -ml-2" style={{ backgroundColor: '#f79e1b', mixBlendMode: 'hard-light' }} />
      </span>
      <span className="text-[9px] font-extrabold tracking-wide px-1.5 py-[3px] rounded"
        style={{ color: tone === 'light' ? '#0a3a8c' : '#fff', backgroundColor: tone === 'light' ? 'rgba(255,255,255,0.92)' : '#0a3a8c' }}>
        AMEX
      </span>
    </div>
  )
}

// ── Patterns ────────────────────────────────────────────────────────────────────
const PATTERNS: Pattern[] = [
  {
    id: 'obsidian',
    label: 'Obsidian',
    fg: '#fff',
    tone: 'light',
    swatch: { background: 'linear-gradient(135deg,#0b0b16,#2b2bf5)' },
    layers: (
      <>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0a0a14 0%,#171734 45%,#2b2bf5 130%)' }} />
        <div className="absolute -top-1/3 -right-1/4 w-2/3 h-2/3 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,131,255,0.45) 0%, transparent 70%)', filter: 'blur(8px)' }} />
      </>
    ),
  },
  {
    id: 'holo',
    label: 'Holographic',
    fg: '#1e1b4b',
    tone: 'dark',
    swatch: { background: 'conic-gradient(from 180deg,#a5f3fc,#c4b5fd,#fbcfe8,#bbf7d0,#a5f3fc)' },
    layers: (
      <>
        <div className="absolute inset-0"
          style={{ background: 'conic-gradient(from 210deg at 30% 20%, #a5f3fc, #c4b5fd, #fbcfe8, #fde68a, #bbf7d0, #a5f3fc)', filter: 'saturate(1.15)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.5) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.35) 100%)' }} />
      </>
    ),
  },
  {
    id: 'mesh',
    label: 'Nebula',
    fg: '#fff',
    tone: 'light',
    swatch: { background: 'radial-gradient(at 30% 30%,#2b2bf5,#7c3aed,#0b0b16)' },
    layers: (
      <>
        <div className="absolute inset-0" style={{ backgroundColor: '#10101f' }} />
        <div className="absolute inset-0" style={{
          background:
            'radial-gradient(at 18% 22%, rgba(43,43,245,0.9) 0px, transparent 45%), radial-gradient(at 82% 12%, rgba(124,58,237,0.85) 0px, transparent 45%), radial-gradient(at 75% 92%, rgba(236,72,153,0.6) 0px, transparent 50%)',
        }} />
      </>
    ),
  },
  {
    id: 'frost',
    label: 'Frost',
    fg: '#1e1b4b',
    tone: 'dark',
    swatch: { background: 'linear-gradient(135deg,#eef2ff,#c7d2fe)' },
    layers: (
      <>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#f5f7ff 0%,#dbe2fe 55%,#aab8fc 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.6) 0%, transparent 40%)' }} />
      </>
    ),
  },
  {
    id: 'carbon',
    label: 'Carbon',
    fg: '#fff',
    tone: 'light',
    swatch: { background: 'repeating-linear-gradient(45deg,#18181b,#18181b 2px,#27272a 2px,#27272a 4px)' },
    layers: (
      <>
        <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg,#161619 0px,#161619 3px,#222227 3px,#222227 6px)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(43,43,245,0.25) 0%, transparent 50%)' }} />
      </>
    ),
  },
]

function shortAddr(addr?: string): string {
  if (!addr) return '0x00 ···· ···· 0000'
  return `${addr.slice(0, 4)} ···· ···· ${addr.slice(-4)}`
}

export function VirtualCard({
  address,
  balanceUsdc,
  onViewCatalog,
  onViewOrders,
  onTopUp,
}: {
  address?: string
  balanceUsdc?: string
  onViewCatalog?: () => void
  onViewOrders?: () => void
  onTopUp?: () => void
}) {
  const [patternIdx, setPatternIdx] = useState(0)
  const [shineKey, setShineKey] = useState(0)
  const pattern = PATTERNS[patternIdx]
  const tone = pattern.tone

  // Restore saved design (keyed per wallet) on mount / wallet change
  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = address ? `${DESIGN_KEY}_${address.toLowerCase()}` : DESIGN_KEY
    const saved = localStorage.getItem(key) ?? localStorage.getItem(DESIGN_KEY)
    if (saved) {
      const idx = PATTERNS.findIndex((p) => p.id === saved)
      if (idx >= 0) setPatternIdx(idx)
    }
  }, [address])

  function selectPattern(i: number) {
    setPatternIdx(i)
    if (typeof window !== 'undefined') {
      const id = PATTERNS[i].id
      localStorage.setItem(DESIGN_KEY, id)
      if (address) localStorage.setItem(`${DESIGN_KEY}_${address.toLowerCase()}`, id)
    }
  }

  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 220, damping: 18 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 220, damping: 18 })

  // Specular glare follows the cursor
  const glareX = useTransform(mx, [-0.5, 0.5], [20, 80])
  const glareY = useTransform(my, [-0.5, 0.5], [20, 80])
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 25%, transparent 55%)`

  function handleMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  function handleLeave() { mx.set(0); my.set(0) }

  useEffect(() => {
    const t = setInterval(() => setShineKey((k) => k + 1), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center w-full max-w-[400px] mx-auto" style={{ perspective: 1200 }}>
      {/* Pattern switcher */}
      <div className="w-full flex items-center gap-2 mb-4">
        <Palette size={14} className="text-gray-400" />
        <span className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold mr-1">Design</span>
        <div className="flex items-center gap-2">
          {PATTERNS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => selectPattern(i)}
              title={p.label}
              className={`w-6 h-6 rounded-full transition-all ${
                i === patternIdx ? 'ring-2 ring-[#2b2bf5] ring-offset-2 scale-105' : 'ring-1 ring-gray-200 hover:scale-110'
              }`}
              style={p.swatch}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onMouseEnter={() => setShineKey((k) => k + 1)}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative w-full aspect-[1.586/1] rounded-[20px] overflow-hidden select-none"
      >
        {/* Background layers */}
        {pattern.layers}

        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
        />

        {/* Cursor-tracking specular glare */}
        <motion.div className="absolute inset-0 pointer-events-none z-[2]" style={{ background: glare }} />

        {/* Shine sweep (load / hover / 5s) */}
        <div key={shineKey} className="card-shine-sweep" />

        {/* Shadow ring for depth */}
        <div className="absolute inset-0 rounded-[20px] pointer-events-none z-[3]"
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -2px 12px rgba(0,0,0,0.35), 0 22px 45px -18px rgba(0,0,0,0.6)' }} />

        {/* Content */}
        <div className="relative z-[4] h-full flex flex-col justify-between p-6" style={{ color: pattern.fg }}>
          {/* Top */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="USDBT" width={30} height={30} className="rounded-lg" />
              <span className="font-extrabold text-[15px] tracking-tight">$USDBT</span>
            </div>
            <Wifi size={22} style={{ opacity: 0.65, transform: 'rotate(90deg)' }} />
          </div>

          {/* Chip + label */}
          <div className="flex items-end gap-3 -mt-1">
            <Chip />
            <span className="text-[9px] uppercase tracking-[0.2em] pb-1" style={{ opacity: 0.55 }}>Virtual</span>
          </div>

          {/* Address */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] mb-1.5" style={{ opacity: 0.55 }}>Wallet</p>
            <p className="font-mono text-[16px] tracking-[0.12em] font-medium"
              style={{ textShadow: tone === 'light' ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 0 rgba(255,255,255,0.4)' }}>
              {shortAddr(address)}
            </p>
          </div>

          {/* Bottom */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] mb-0.5" style={{ opacity: 0.55 }}>Balance</p>
              <p className="font-bold text-[15px]">{balanceUsdc ?? '—'} <span className="text-[11px] font-semibold opacity-70">USDC</span></p>
            </div>
            <NetworkLogos tone={tone} />
          </div>
        </div>
      </motion.div>

      {/* Caption */}
      <p className="text-[11px] text-gray-400 text-center mt-4 max-w-[300px] leading-relaxed">
        <small>Card is issued on wallet connect and its value is tied to your wallet balance.</small>
      </p>

      {/* Action buttons */}
      <div className="w-full grid grid-cols-3 gap-2.5 mt-4">
        {[
          { label: 'Catalog', icon: Store, onClick: onViewCatalog },
          { label: 'Orders', icon: ScrollText, onClick: onViewOrders },
          { label: 'Top up', icon: ArrowDownToLine, onClick: onTopUp },
        ].map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white border border-[rgba(43,43,245,0.2)] shadow-[inset_4px_4px_10px_rgba(43,43,245,0.07),inset_-4px_-4px_10px_rgba(43,43,245,0.07)] hover:border-[rgba(43,43,245,0.5)] hover:shadow-[inset_6px_6px_14px_rgba(43,43,245,0.14),inset_-6px_-6px_14px_rgba(43,43,245,0.14)] transition-all"
          >
            <Icon size={17} style={{ color: '#2b2bf5' }} />
            <span className="text-[11px] font-semibold text-gray-600">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
