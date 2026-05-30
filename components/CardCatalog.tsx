'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, MoreHorizontal, LayoutGrid, List, Bookmark } from 'lucide-react'
import { motion } from 'framer-motion'
import { fetchProducts, priceLabel, titleize, type Product } from '@/lib/api'
import { labelForCategory } from '@/lib/categories'

function productMatchesCategory(p: Product, slug: string | null | undefined): boolean {
  if (!slug) return true
  const target = slug.toLowerCase()
  return (p.categories ?? []).some((c) => c.toLowerCase() === target)
}

const FEATURED = ['Amazon', 'Netflix', 'Steam', 'Google Play']

function brandType(denominations: number[], range: Product['range']): string {
  if (range) return 'Variable'
  if (denominations.length > 0) return 'Fixed'
  return 'Gift Card'
}

function categoryLabel(p: Product): string {
  if (p.categories && p.categories.length > 0) return titleize(p.categories[0])
  return p.country || 'Global'
}

function maxValueLabel(p: Product): string {
  if (p.range) return `Max $${p.range.max}`
  if (p.denominations.length > 0) return `Max $${Math.max(...p.denominations)}`
  return 'Max —'
}

const BRAND_COLORS = [
  '#4f46e5','#0ea5e9','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#06b6d4','#84cc16','#f97316','#ec4899',
]

function brandColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return BRAND_COLORS[h % BRAND_COLORS.length]
}

function brandInitials(name: string): string {
  const words = name.replace(/gift\s*card|egift|voucher|prepaid/gi, '').trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function buildImageSrcs(product: Product): string[] {
  const { image } = product
  if (!image) return []

  // Extract domain — works whether image is a clearbit URL or a plain domain string
  let domain = ''
  if (image.startsWith('https://logo.clearbit.com/')) {
    domain = image.slice('https://logo.clearbit.com/'.length)
  } else if (/^https?:\/\//i.test(image)) {
    return [image]  // direct URL — use as-is, no further derivation
  }

  if (!domain) return []

  return [
    `https://logo.clearbit.com/${domain}`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ]
}

function ProductThumb({ product, className }: { product: Product; className?: string }) {
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const srcs = buildImageSrcs(product)
  const src = srcs[attempt]

  return (
    <div className={`relative ${className ?? ''}`}>
      {src && attempt < srcs.length ? (
        <>
          {!loaded && <div className="absolute inset-0 rounded-[inherit] bg-gray-100 animate-pulse" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={product.name}
            className={`w-full h-full object-contain p-1.5 transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => { setLoaded(false); setAttempt((a) => a + 1) }}
          />
        </>
      ) : (
        <div
          className="w-full h-full flex items-center justify-center rounded-[inherit] text-white font-bold text-sm select-none"
          style={{ backgroundColor: brandColor(product.name) }}
        >
          {brandInitials(product.name)}
        </div>
      )}
    </div>
  )
}

function ProductCard({
  product, index, selected, isSaved, onSelect, onToggleSave,
}: {
  product: Product
  index: number
  selected: boolean
  isSaved: boolean
  onSelect: (p: Product) => void
  onToggleSave?: (p: Product) => void
}) {
  const [shineKey, setShineKey] = useState(0)

  return (
    <div
      className={`relative text-left p-3.5 rounded-xl border transition-all min-h-[130px] flex flex-col overflow-hidden ${
        selected
          ? 'border-[#2b2bf5] bg-[#eef0ff] shadow-[inset_6px_6px_14px_rgba(43,43,245,0.18),inset_-6px_-6px_14px_rgba(43,43,245,0.18)]'
          : 'border-[rgba(43,43,245,0.3)] bg-white shadow-[inset_5px_5px_12px_rgba(43,43,245,0.18),inset_-5px_-5px_12px_rgba(43,43,245,0.18)] hover:border-[rgba(43,43,245,0.6)] hover:shadow-[inset_7px_7px_18px_rgba(43,43,245,0.32),inset_-7px_-7px_18px_rgba(43,43,245,0.32)]'
      }`}
      onMouseEnter={() => setShineKey((k) => k + 1)}
    >
      {/* Shine sweep */}
      <div
        key={shineKey}
        className="card-shine-sweep"
        style={{ '--shine-delay': shineKey === 0 ? `${index * 60}ms` : '0ms' } as React.CSSProperties}
      />

      {onToggleSave && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(product) }}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white shadow-sm transition-colors z-30"
          aria-label={isSaved ? 'Unsave' : 'Save'}
        >
          <Bookmark size={15} className={isSaved ? 'fill-[#2b2bf5] text-[#2b2bf5]' : 'text-gray-400'} />
        </button>
      )}
      <motion.button
        onClick={() => onSelect(product)}
        whileTap={{ scale: 0.96 }}
        className="flex flex-col flex-1 text-left w-full relative z-10"
      >
        <ProductThumb product={product} className="w-10 h-10 rounded-xl mb-3 overflow-hidden flex-shrink-0" />
        <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">{product.name}</p>
        <p className="text-xs text-gray-400 mt-1">{categoryLabel(product)}</p>
        <div className="mt-auto pt-2">
          {(product.denominations.length > 0 || product.range) && (
            <p className="text-xs font-medium text-gray-600">{priceLabel(product)}</p>
          )}
          <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
            {brandType(product.denominations, product.range)}
          </span>
        </div>
      </motion.button>
    </div>
  )
}

const PAGE_SIZE = 24

function SkeletonCard() {
  return (
    <div className="relative p-3.5 rounded-xl border border-[rgba(43,43,245,0.15)] bg-white min-h-[130px] flex flex-col animate-pulse">
      <div className="w-10 h-10 rounded-xl mb-3 bg-gray-100" />
      <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-2.5 bg-gray-100 rounded w-1/2 mb-auto" />
      <div className="mt-4 h-2.5 bg-gray-100 rounded w-1/3" />
    </div>
  )
}

export function CardCatalog({
  search,
  selectedProduct,
  onSelect,
  savedIds,
  onToggleSave,
  categoryFilter,
}: {
  search: string
  selectedProduct: Product | null
  onSelect: (p: Product) => void
  savedIds?: Set<string>
  onToggleSave?: (p: Product) => void
  categoryFilter?: string | null
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const [category, setCategory] = useState<'all' | 'fixed' | 'variable'>('all')
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc'>('name_asc')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fetchProducts()
      .then((items) => { if (!cancelled) setProducts(items) })
      .catch(() => { if (!cancelled) setError('Failed to load gift cards. Try refreshing.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Reveal more cards as user scrolls to the sentinel
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount((c) => c + PAGE_SIZE) },
      { rootMargin: '200px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loading])

  const featured = FEATURED
    .map((name) => products.find((p) => p.name.toLowerCase().includes(name.toLowerCase())))
    .filter(Boolean) as Product[]

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => {
      if (category === 'all') return true
      if (category === 'fixed') return !p.range
      return !!p.range
    })
    .filter((p) => productMatchesCategory(p, categoryFilter))
    .sort((a, b) => {
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
      return a.name.localeCompare(b.name)
    })

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visible.length < filtered.length

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search, category, sortBy, categoryFilter])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
        <Loader2 size={72} className="animate-spin" style={{ color: '#2b2bf5' }} />
        <p className="text-lg text-gray-400">Loading gift cards…</p>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-20 text-red-400 text-sm">{error}</div>
  }

  return (
    <div>
      {/* Quick Picks */}
      {!search && featured.length > 0 && (
        <div className="bg-white rounded-xl p-5 mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Quick Picks</h2>
            <button className="p-1 rounded-md hover:bg-gray-100 text-gray-300 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {featured.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                  selectedProduct?.id === p.id
                    ? 'border-[--color-brand] bg-[--color-brand-light]'
                    : 'border-gray-100 hover:border-gray-300 hover:shadow-sm bg-white'
                }`}
              >
                <ProductThumb product={p} className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center overflow-hidden" />
                <p className="text-sm font-semibold text-gray-800 leading-tight">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{priceLabel(p)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brand listing */}
      <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100">
        {/* Controls row */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-400">All Cards</span>
            <span className="text-gray-300 mx-1">/</span>
            <span className="font-medium text-gray-700">{categoryFilter ? labelForCategory(categoryFilter) : 'Gift Cards'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 mr-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'fixed', label: 'Fixed' },
                { id: 'variable', label: 'Variable' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id as 'all' | 'fixed' | 'variable')}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    category === c.id
                      ? 'bg-[--color-brand-light] border-[--color-brand] text-[--color-brand]'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
            >
              {viewMode === 'list' ? <LayoutGrid size={15} /> : <List size={15} />}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name_asc' | 'name_desc')}
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors outline-none"
            >
              <option value="name_asc">Sort: A → Z</option>
              <option value="name_desc">Sort: Z → A</option>
            </select>
          </div>
        </div>

        {viewMode === 'list' ? (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-2.5 w-[38%]">Name</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Category</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Value</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Type</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const isSaved = savedIds?.has(p.id) ?? false
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelect(p)}
                    className={`border-b border-gray-50 cursor-pointer transition-colors ${
                      selectedProduct?.id === p.id
                        ? 'bg-[--color-brand-light]'
                        : 'hover:bg-[#f8f9fb]'
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb product={p} className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{categoryLabel(p)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{priceLabel(p)}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{maxValueLabel(p)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                        {brandType(p.denominations, p.range)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onToggleSave && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleSave(p) }}
                            className="p-1 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Bookmark size={14} className={isSaved ? 'fill-[#2b2bf5] text-[#2b2bf5]' : ''} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelect(p) }}
                          className="p-1 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400 text-sm">
                    No results for &ldquo;{search}&rdquo;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {visible.map((p, i) => {
              const isSaved = savedIds?.has(p.id) ?? false
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  selected={selectedProduct?.id === p.id}
                  isSaved={isSaved}
                  onSelect={onSelect}
                  onToggleSave={onToggleSave}
                />
              )
            })}
            {/* Skeleton cards while more are being revealed */}
            {hasMore && Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={`sk-${i}`} />
            ))}
            {/* Scroll sentinel */}
            <div ref={sentinelRef} className="col-span-full h-1" />
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">{filtered.length} cards</p>
        </div>
      </div>
    </div>
  )
}
