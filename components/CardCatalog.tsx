'use client'

import { useEffect, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { fetchProducts, type Product } from '@/lib/api'

export function CardCatalog({ onSelect }: { onSelect: (p: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError('Failed to load gift cards. Try refreshing.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Gift Cards</h1>
        <p className="text-gray-500 text-sm mt-1">
          200+ brands · delivered to your inbox · no KYC
        </p>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search Amazon, Netflix, Steam…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-[--color-surface-2] rounded-xl bg-[--color-surface] outline-none focus:border-[--color-brand] focus:bg-white transition-colors"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading gift cards…
        </div>
      )}

      {error && (
        <div className="text-center py-20 text-red-500 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelect(product)}
              className="group text-left p-4 rounded-xl border border-[--color-surface-2] bg-[--color-surface] hover:border-[--color-brand] hover:bg-white transition-colors"
            >
              <p className="font-medium text-sm leading-tight">{product.name}</p>
              {product.denominations.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  From ${Math.min(...product.denominations)}
                </p>
              )}
              {product.range && (
                <p className="text-xs text-gray-400 mt-1">
                  ${product.range.min}–${product.range.max}
                </p>
              )}
            </button>
          ))}

          {filtered.length === 0 && (
            <p className="col-span-full text-center text-gray-400 text-sm py-12">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      )}
    </main>
  )
}
