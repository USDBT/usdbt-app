'use client'

import { useEffect } from 'react'
import { Command } from 'cmdk'
import { Search, CreditCard, ShoppingBag, ScrollText, Bookmark } from 'lucide-react'
import type { Product } from '@/lib/api'

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
        if (open) onClose(); else onClose() // toggle handled by parent
      }
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40"
        onClick={onClose}
      />
      <div className="fixed top-[18%] left-1/2 -translate-x-1/2 z-[101] w-[560px] max-w-[calc(100vw-24px)]">
        <Command
          className="bg-white rounded-2xl overflow-hidden shadow-2xl"
          shouldFilter
        >
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-gray-700 aria-selected:bg-gray-50"
                  >
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[#eef0ff] flex-shrink-0 overflow-hidden">
                      {p.image
                        ? <img src={p.image} alt="" className="w-full h-full object-contain p-0.5" />
                        : <CreditCard size={12} style={{ color: 'var(--color-brand)' }} />
                      }
                    </div>
                    <span className="flex-1">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.type || 'Gift Card'}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Navigation">
              {[
                { icon: ShoppingBag, label: 'Shop', hint: 'Browse all gift cards' },
                { icon: ScrollText, label: 'Orders', hint: 'Your order history' },
                { icon: Bookmark,   label: 'Saved', hint: 'Your saved cards' },
              ].map(({ icon: Icon, label, hint }) => (
                <Command.Item
                  key={label}
                  value={label}
                  onSelect={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-gray-700 aria-selected:bg-gray-50"
                >
                  <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={12} className="text-gray-500" />
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
