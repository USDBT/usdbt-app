'use client'

import { useEffect, useState } from 'react'
import { Loader2, MoreHorizontal, LayoutGrid, List, CreditCard, Bookmark } from 'lucide-react'
import { fetchProducts, priceLabel, titleize, type Product } from '@/lib/api'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'gaming':    ['game', 'gaming', 'steam', 'xbox', 'playstation', 'nintendo', 'roblox', 'blizzard', 'battle'],
  'streaming': ['netflix', 'hulu', 'disney', 'hbo', 'spotify', 'youtube', 'twitch', 'deezer', 'apple music', 'prime'],
  'travel':    ['airbnb', 'uber', 'expedia', 'booking', 'hotel', 'airline', 'flight', 'lyft'],
  'food':      ['doordash', 'grubhub', 'starbucks', 'mcdonald', 'domino', 'pizza', 'dining', 'ubereats', 'seamless', 'chipotle'],
  'shopping':  ['amazon', 'walmart', 'target', 'ebay', 'bestbuy', 'clothing', 'fashion', 'nordstrom', 'shein'],
}

function productMatchesCategory(p: Product, cat: string | null | undefined): boolean {
  if (!cat || cat === 'Gift Cards') return true
  const lower = cat.toLowerCase()
  const haystack = [
    p.name.toLowerCase(),
    ...(p.categories ?? []).map((c) => c.toLowerCase()),
    (p.type ?? '').toLowerCase(),
  ].join(' ')
  if (haystack.includes(lower)) return true
  return (CATEGORY_KEYWORDS[lower] ?? []).some((kw) => haystack.includes(kw))
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

function ProductThumb({ product, className }: { product: Product; className?: string }) {
  const [attempt, setAttempt] = useState(0)

  const srcs = (() => {
    if (!product.image) return []
    const domain = product.image.replace('https://logo.clearbit.com/', '')
    const isDomain = !domain.startsWith('http') && domain.includes('.')
    return [
      product.image,
      isDomain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '',
    ].filter(Boolean) as string[]
  })()

  const src = srcs[attempt]
  const exhausted = attempt >= srcs.length

  return (
    <div className={className}>
      {src && !exhausted ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={product.name}
          className="w-full h-full object-contain p-1.5"
          onError={() => setAttempt((a) => a + 1)}
        />
      ) : (
        <div className="w-full h-full rounded-[inherit] bg-gradient-to-br from-slate-100 via-slate-200 to-blue-100 border border-slate-200 flex items-center justify-center">
          <CreditCard size={18} className="text-slate-500" />
        </div>
      )}
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
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [category, setCategory] = useState<'all' | 'fixed' | 'variable'>('all')
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc'>('name_asc')
  const [uiPage, setUiPage] = useState(1)
  const perPage = 20

  useEffect(() => {
    fetchProducts(0)
      .then((items) => {
        setProducts(items)
        setPage(0)
        setHasMore(items.length >= 100)
      })
      .catch(() => setError('Failed to load gift cards. Try refreshing.'))
      .finally(() => setLoading(false))
  }, [])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const items = await fetchProducts(nextPage)
      setProducts((prev) => {
        const map = new Map(prev.map((p) => [p.id, p] as const))
        for (const item of items) map.set(item.id, item)
        return Array.from(map.values())
      })
      setPage(nextPage)
      setHasMore(items.length >= 100)
    } catch {
      setError('Failed to load more cards.')
    } finally {
      setLoadingMore(false)
    }
  }

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((uiPage - 1) * perPage, uiPage * perPage)

  useEffect(() => {
    setUiPage(1)
  }, [search, category, sortBy, products.length, categoryFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
        <Loader2 size={16} className="animate-spin" /> Loading gift cards…
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
            <span className="font-medium text-gray-700">{categoryFilter || 'Gift Cards'}</span>
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
              {paged.map((p) => {
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
            {paged.map((p) => {
              const isSaved = savedIds?.has(p.id) ?? false
              return (
                <div
                  key={p.id}
                  className={`relative text-left p-3.5 rounded-xl border transition-all min-h-[130px] flex flex-col ${
                    selectedProduct?.id === p.id
                      ? 'border-[--color-brand] bg-[--color-brand-light]'
                      : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {onToggleSave && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleSave(p) }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white shadow-sm transition-colors z-10"
                      aria-label={isSaved ? 'Unsave' : 'Save'}
                    >
                      <Bookmark size={15} className={isSaved ? 'fill-[#2b2bf5] text-[#2b2bf5]' : 'text-gray-400'} />
                    </button>
                  )}
                  <button onClick={() => onSelect(p)} className="flex flex-col flex-1 text-left w-full">
                    <ProductThumb product={p} className="w-10 h-10 rounded-xl mb-3 overflow-hidden flex-shrink-0" />
                    <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{categoryLabel(p)}</p>
                    <div className="mt-auto pt-2">
                      <p className="text-xs text-gray-500">{priceLabel(p)}</p>
                      <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                        {brandType(p.denominations, p.range)}
                      </span>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">{filtered.length} cards loaded</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUiPage((p) => Math.max(1, p - 1))}
              disabled={uiPage <= 1}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs text-gray-500">Page {uiPage} / {totalPages}</span>
            <button
              onClick={() => setUiPage((p) => Math.min(totalPages, p + 1))}
              disabled={uiPage >= totalPages}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
              >
                {loadingMore && <Loader2 size={12} className="animate-spin" />}
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
