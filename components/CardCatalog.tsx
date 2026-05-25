'use client'

import { useEffect, useState } from 'react'
import { Loader2, MoreHorizontal, LayoutGrid, List, ChevronDown } from 'lucide-react'
import { fetchProducts, priceLabel, type Product } from '@/lib/api'

const FEATURED = ['Amazon', 'Netflix', 'Steam', 'Google Play']

function brandType(denominations: number[], range: Product['range']): string {
  if (denominations.length > 0) return 'Fixed'
  if (range) return 'Variable'
  return 'Gift Card'
}

export function CardCatalog({
  search,
  selectedProduct,
  onSelect,
}: {
  search: string
  selectedProduct: Product | null
  onSelect: (p: Product) => void
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError('Failed to load gift cards. Try refreshing.'))
      .finally(() => setLoading(false))
  }, [])

  const featured = FEATURED
    .map((name) => products.find((p) => p.name.toLowerCase().includes(name.toLowerCase())))
    .filter(Boolean) as Product[]

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

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
                <div className="w-10 h-10 rounded-xl bg-[--color-brand-light] mb-3 flex items-center justify-center overflow-hidden">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-[--color-brand] font-bold text-base">{p.name[0]}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-800 leading-tight">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{priceLabel(p)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brand table */}
      <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100">
        {/* Controls row */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-400">All Cards</span>
            <span className="text-gray-300 mx-1">/</span>
            <span className="font-medium text-gray-700">Gift Cards</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
            >
              {viewMode === 'list' ? <LayoutGrid size={15} /> : <List size={15} />}
            </button>
            <button className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              Sort <ChevronDown size={11} className="ml-0.5" />
            </button>
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
              {filtered.map((p) => (
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
                      <div className="w-7 h-7 rounded-lg bg-[--color-brand-light] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <span className="text-[--color-brand] text-[10px] font-bold">{p.name[0]}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.type || 'Gift Card'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{priceLabel(p)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                      {brandType(p.denominations, p.range)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelect(p) }}
                      className="p-1 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </td>
                </tr>
              ))}
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
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  selectedProduct?.id === p.id
                    ? 'border-[--color-brand] bg-[--color-brand-light]'
                    : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <p className="text-sm font-medium text-gray-800 leading-tight">{p.name}</p>
                <p className="text-xs text-gray-400 mt-1">{priceLabel(p)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
