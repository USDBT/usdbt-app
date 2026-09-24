import { createElement } from 'react'
import type { Product } from './api'

// Icons8 hosted artwork keeps category navigation quiet so brand marks remain the visual focus.
const ICON8_ASSETS: Record<string, string> = {
  'e-commerce': 'shopping-bag', games: 'game-controller', gaming: 'game-controller',
  retail: 'shop', entertainment: 'clapperboard', streaming: 'tv', food: 'restaurant',
  groceries: 'shopping-basket', home: 'home', electronics: 'laptop',
  travel_flights: 'airplane', travel: 'airplane', apparel_clothing: 'clothes',
  apparel: 'clothes', health_beauty: 'spa-flower', sports_fitness: 'dumbbell',
  charity_donations: 'donate', books_learning: 'book', 'e-money': 'wallet',
  other_products: 'package',
}

function icon8(slug: string): React.ElementType {
  const iconName = ICON8_ASSETS[slug] ?? 'gift-card'
  return function Icons8CategoryIcon({ size = 18, className = '', style }: {
    size?: number; className?: string; style?: React.CSSProperties
  }) {
    return createElement('img', {
      src: 'https://img.icons8.com/ios/50/2b2bf5/' + iconName + '.png',
      alt: '',
      'aria-hidden': true,
      width: size,
      height: size,
      loading: 'lazy',
      className,
      style: { width: size, height: size, objectFit: 'contain', ...style },
    })
  }
}
const CATEGORY_LABELS: Record<string, string> = {
  'e-commerce': 'Shopping', travel_flights: 'Travel', apparel_clothing: 'Apparel',
  health_beauty: 'Health & Beauty', sports_fitness: 'Sports & Fitness',
  charity_donations: 'Charity', books_learning: 'Books', 'e-money': 'Prepaid',
  other_products: 'Other',
}

export function iconForCategory(slug: string): React.ElementType {
  return icon8(slug.toLowerCase())
}

export function labelForCategory(slug: string): string {
  const key = slug.toLowerCase()
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key]
  return slug.replace(/[_-]+/g, ' ').split(' ').filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export interface DerivedCategory {
  slug: string
  label: string
  icon: React.ElementType
  count: number
}

export function deriveCategories(products: Product[]): DerivedCategory[] {
  const counts = new Map<string, number>()
  for (const product of products) {
    for (const category of product.categories ?? []) {
      const key = category.toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([slug, count]) => ({ slug, label: labelForCategory(slug), icon: iconForCategory(slug), count }))
    .sort((a, b) => b.count - a.count)
}
