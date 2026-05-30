'use client'

import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { Search, ShoppingBag, ScrollText, Bookmark } from 'lucide-react'
import type { Product } from '@/lib/api'

const BRAND_COLORS = [
  '#4f46e5','#0ea5e9','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#06b6d4','#84cc16','#f97316','#ec4899',
]
function brandColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return BRAND_COLORS[h % BRAND_COLORS.length]
}
function brandInitials(name: string) {
  const words = name.replace(/gift\s*card|egift|voucher|prepaid/gi, '').trim().split(/\s+/)
  return words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function SearchThumb({ product }: { product: Product }) {
  const srcs = (() => {
    const { image } = product
    if (!image) return []
    if (image.startsWith('https://logo.clearbit.com/')) {
      const domain = image.slice('https://logo.clearbit.com/'.length)
      return [image, `https://icons.duckduckgo.com/ip3/${domain}.ico`]
    }
    if (/^https?:\/\//i.test(image)) return [image]
    return []
  })()
  const [attempt, setAttempt] = useState(0)
  const src = srcs[attempt]

  if (src && attempt < srcs.length) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={product.name}
        className="w-full h-full object-contain p-0.5"
        onError={() => setAttempt(a => a + 1)}
      />
    )
  }
  return (
    <span
      className="w-full h-full flex items-center justify-center text-white text-[8px] font-bold rounded-md"
      style={{ backgroundColor: brandColor(product.name) }}
    >
      {brandInitials(product.name)}
    </span>
  )
}

export function CommandSearch({
  open,
  onClose,
  products,
  onSelectProduct,
}: {
  open: boolean
  onClose: () => void
  products: Product[]
  onSelectProduct: (p: Product) => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose(); else onClose()
      }
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} />
      <div className="fixed top-[18%] left-1/2 -translate-x-1/2 z-[101] w-[560px] max-w-[calc(100vw-24px)]">
        <Command className="bg-white rounded-2xl overflow-hidden shadow-2xl" shouldFilter>
          <div className="flex items-center gap-3 px-4 border-b border-gray-100">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <Command.Input
              placeholder="Search gift cards, brands…"
              className="w-full py-4 text-sm outline-none placeholder:text-gray-400 bg-transparent"
              autoFocus
            />
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-gray-300 border border-gray-200 rounded px-1.5 py-0.5 font-mono flex-shrink-0">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[380px] overflow-y-auto p-2">
            <Command.Empty className="py-10 text-center text-sm text-gray-400">
              No results found.
            </Command.Empty>

            {products.length > 0 && (
              <Command.Group heading="Gift Cards">
                {products.slice(0, 8).map((p) => (
                  <Command.Item
                    key={p.id}
                    value={p.name}
                    onSelect={() => { onSelectProduct(p); onClose() }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-gray-700 border border-[rgba(43,43,245,0.2)] bg-white shadow-[inset_4px_4px_8px_rgba(43,43,245,0.1),inset_-4px_-4px_8px_rgba(43,43,245,0.1)] aria-selected:border-[rgba(43,43,245,0.5)] aria-selected:shadow-[inset_5px_5px_12px_rgba(43,43,245,0.2),inset_-5px_-5px_12px_rgba(43,43,245,0.2)] aria-selected:bg-[#eef0ff] mb-1.5 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden border border-[rgba(43,43,245,0.1)]">
                      <SearchThumb product={p} />
                    </div>
                    <span className="flex-1">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.type || 'Gift Card'}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Navigation">
              {[
                { icon: ShoppingBag, label: 'Shop',   hint: 'Browse all gift cards' },
                { icon: ScrollText,  label: 'Orders',  hint: 'Your order history' },
                { icon: Bookmark,    label: 'Saved',   hint: 'Your saved cards' },
              ].map(({ icon: Icon, label, hint }) => (
                <Command.Item
                  key={label}
                  value={label}
                  onSelect={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-gray-700 border border-[rgba(43,43,245,0.15)] bg-white shadow-[inset_4px_4px_8px_rgba(43,43,245,0.07),inset_-4px_-4px_8px_rgba(43,43,245,0.07)] aria-selected:border-[rgba(43,43,245,0.4)] aria-selected:shadow-[inset_5px_5px_12px_rgba(43,43,245,0.15),inset_-5px_-5px_12px_rgba(43,43,245,0.15)] aria-selected:bg-[#eef0ff] mb-1.5 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#eef0ff] flex items-center justify-center flex-shrink-0">
                    <Icon size={13} style={{ color: '#2b2bf5' }} />
                  </div>
                  <span className="flex-1">{label}</span>
                  <span className="text-xs text-gray-400">{hint}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </>
  )
}
