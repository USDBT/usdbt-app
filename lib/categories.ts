import {
  ShoppingCart, Gamepad2, Store, Clapperboard, Tv, Utensils, ShoppingBasket,
  Home, Laptop, Plane, Shirt, Sparkles, Dumbbell, HeartHandshake, BookOpen,
  Wallet, Package, Tag, Gift, Smartphone, Coffee, Plug, Car,
} from 'lucide-react'
import type { Product } from './api'

// Explicit icon map for known Cryptorefills category slugs
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'e-commerce': ShoppingCart,
  'games': Gamepad2,
  'gaming': Gamepad2,
  'retail': Store,
  'entertainment': Clapperboard,
  'streaming': Tv,
  'food': Utensils,
  'groceries': ShoppingBasket,
  'home': Home,
  'electronics': Laptop,
  'travel_flights': Plane,
  'travel': Plane,
  'apparel_clothing': Shirt,
  'apparel': Shirt,
  'health_beauty': Sparkles,
  'sports_fitness': Dumbbell,
  'charity_donations': HeartHandshake,
  'books_learning': BookOpen,
  'e-money': Wallet,
  'other_products': Package,
}

// Nicer display labels for a few slugs; otherwise titleized
const CATEGORY_LABELS: Record<string, string> = {
  'e-commerce': 'Shopping',
  'travel_flights': 'Travel',
  'apparel_clothing': 'Apparel',
  'health_beauty': 'Health & Beauty',
  'sports_fitness': 'Sports & Fitness',
  'charity_donations': 'Charity',
  'books_learning': 'Books',
  'e-money': 'Prepaid',
  'other_products': 'Other',
}

// Deterministic fallback pool — same category name always maps to the same icon
const FALLBACK_POOL: React.ElementType[] = [
  Gift, Smartphone, Coffee, Plug, Car, Package, Tag,
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function iconForCategory(slug: string): React.ElementType {
  const key = slug.toLowerCase()
  if (CATEGORY_ICONS[key]) return CATEGORY_ICONS[key]
  // predictable fallback from the pool, deterministic by name
  return FALLBACK_POOL[hash(key) % FALLBACK_POOL.length] ?? Tag
}

export function labelForCategory(slug: string): string {
  const key = slug.toLowerCase()
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key]
  return slug
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export interface DerivedCategory {
  slug: string
  label: string
  icon: React.ElementType
  count: number
}

// Build the real category list from the loaded products, sorted by count desc
export function deriveCategories(products: Product[]): DerivedCategory[] {
  const counts = new Map<string, number>()
  for (const p of products) {
    for (const c of p.categories ?? []) {
      const key = c.toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([slug, count]) => ({ slug, label: labelForCategory(slug), icon: iconForCategory(slug), count }))
    .sort((a, b) => b.count - a.count)
}
