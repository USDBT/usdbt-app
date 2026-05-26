import type { Product } from './api'

const KEY = 'usdbt_saved_cards'

export function getSavedCards(): Product[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function toggleSavedCard(product: Product): Product[] {
  const current = getSavedCards()
  const exists = current.some(p => p.id === product.id)
  const next = exists ? current.filter(p => p.id !== product.id) : [product, ...current]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function isSaved(id: string): boolean {
  return getSavedCards().some(p => p.id === id)
}
