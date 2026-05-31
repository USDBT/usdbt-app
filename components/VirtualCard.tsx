'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Palette, Wifi } from 'lucide-react'

// Premade card patterns (background styles)
const PATTERNS: { id: string; label: string; style: React.CSSProperties; fg: string }[] = [
  {
    id: 'midnight',
    label: 'Midnight',
    style: { background: 'linear-gradient(135deg, #1a1a3e 0%, #2b2bf5 100%)' },
    fg: '#ffffff',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    style: { background: 'linear-gradient(135deg, #2b2bf5 0%, #7c3aed 50%, #ec4899 100%)' },
    fg: '#ffffff',
  },
  {
    id: 'mesh',
    label: 'Mesh',
    style: {
      background:
        'radial-gradient(at 20% 20%, #2b2bf5 0px, transparent 50%), radial-gradient(at 80% 0%, #7c83ff 0px, transparent 50%), radial-gradient(at 80% 100%, #4f46e5 0px, transparent 50%), #1a1a3e',
    },
    fg: '#ffffff',
  },
  {
    id: 'frost',
    label: 'Frost',
    style: { background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)' },
    fg: '#1e1b4b',
  },
  {
    id: 'carbon',
    label: 'Carbon',
    style: {
      background:
        'repeating-linear-gradient(45deg, #18181b 0px, #18181b 2px, #27272a 2px, #27272a 4px)',
    },
    fg: '#ffffff',
  },
]

// Card network marks — accepted payment rails via Cryptorefills
function NetworkLogos({ tone }: { tone: 'light' | 'dark' }) {
  const stroke = tone === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(30,27,75,0.9)'
  return (
    <div className="flex items-center gap-1.5">
      {/* Visa */}
      <span className="text-[13px] font-bold italic tracking-tight" style={{ color: stroke, fontFamily: 'Georgia, serif' }}>
        VISA
      </span>
      {/* Mastercard */}
      <span className="relative inline-flex items-center" aria-label="Mastercard">
        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: '#eb001b', opacity: 0.9 }} />
        <span className="w-3.5 h-3.5 rounded-full -ml-1.5" style={{ backgroundColor: '#f79e1b', opacity: 0.85 }} />
      </span>
      {/* Amex */}
      <span
        className="text-[8px] font-bold px-1 py-0.5 rounded"
        style={{ color: tone === 'light' ? '#1a1a3e' : '#fff', backgroundColor: tone === 'light' ? 'rgba(255,255,255,0.85)' : '#2b2bf5' }}
      >
        AMEX
      </span>
    </div>
  )
}

function shortAddr(addr?: string): string {
  if (!addr) return '0x0000 •••• •••• 0000'
  return `${addr.slice(0, 6)} •••• •••• ${addr.slice(-4)}`
}

export function VirtualCard({ address, balanceUsdc }: { address?: string; balanceUsdc?: string }) {
  const [patternIdx, setPatternIdx] = useState(0)
  const [shineKey, setShineKey] = useState(0)
  const pattern = PATTERNS[patternIdx]
  const tone = pattern.fg === '#ffffff' ? 'light' : 'dark'

  // 3D tilt
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 18 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 18 })

  function handleMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  function handleLeave() {
    mx.set(0)
    my.set(0)
  }

  // Auto shine every 5s, plus on mount
  useEffect(() => {
    const t = setInterval(() => setShineKey((k) => k + 1), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Pattern switcher */}
      <div className="w-full flex items-center gap-2 mb-3">
        <Palette size={14} className="text-gray-400" />
        <span className="text-[11px] text-gray-400 font-medium mr-1">Design</span>
        <div className="flex items-center gap-1.5">
          {PATTERNS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setPatternIdx(i)}
              title={p.label}
              className={`w-5 h-5 rounded-full border transition-all ${
                i === patternIdx ? 'ring-2 ring-[#2b2bf5] ring-offset-1 border-transparent' : 'border-gray-200 hover:scale-110'
              }`}
              style={p.style}
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
        style={{ rotateX, rotateY, transformPerspective: 900, ...pattern.style }}
        className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-xl select-none"
      >
        {/* Shine sweep */}
        <div key={shineKey} className="card-shine-sweep" />

        {/* Content */}
        <div className="relative z-[1] h-full flex flex-col justify-between p-5" style={{ color: pattern.fg }}>
          {/* Top row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="USDBT" width={28} height={28} className="rounded-lg" />
              <span className="font-bold text-sm tracking-wide">$USDBT</span>
            </div>
            <Wifi size={20} style={{ opacity: 0.7, transform: 'rotate(90deg)' }} />
          </div>

          {/* Chip */}
          <div
            className="w-10 h-7 rounded-md mt-1"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #f5e7a0 50%, #d4af37 100%)',
              opacity: 0.92,
            }}
          />

          {/* Wallet address */}
          <div>
            <p className="text-[9px] uppercase tracking-widest mb-1" style={{ opacity: 0.6 }}>
              Wallet
            </p>
            <p className="font-mono text-[13px] tracking-wider" style={{ textShadow: tone === 'light' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none' }}>
              {shortAddr(address)}
            </p>
          </div>

          {/* Bottom row */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ opacity: 0.6 }}>
                Balance
              </p>
              <p className="font-semibold text-sm">{balanceUsdc ?? '—'} USDC</p>
            </div>
            <NetworkLogos tone={tone} />
          </div>
        </div>
      </motion.div>

      {/* Caption */}
      <p className="text-[11px] text-gray-400 text-center mt-3 max-w-xs leading-relaxed">
        <small>Card is issued on wallet connect and its value is tied to your wallet balance.</small>
      </p>
    </div>
  )
}
