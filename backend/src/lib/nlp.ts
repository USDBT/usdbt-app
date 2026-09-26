/**
 * Fast, lightweight NLP pre-processor for USDBT AI Shopping Assistant.
 *
 * Categorizes user intent, extracts entities (brands, categories, amounts, emails, currencies),
 * and strips conversational filler words before sending queries to LLMs or tools.
 * This drastically cuts input tokens per minute (ITPM) and prevents rate-limiting.
 */

export type UserIntent =
  | 'CATEGORY_SEARCH'
  | 'BRAND_SEARCH'
  | 'DENOMINATION_PICK'
  | 'CHECKOUT_INTENT'
  | 'BALANCE_CHECK'
  | 'STATUS_CHECK'
  | 'GREETING'
  | 'UNKNOWN'

export interface ParsedNLP {
  intent: UserIntent
  cleanQuery: string
  category?: string
  brand?: string
  amount?: number
  email?: string
  currency?: 'USDG' | 'ETH'
}

// Category keyword dictionary mapping common conversational terms to catalog categories
const CATEGORY_MAP: Record<string, string[]> = {
  shopping: [
    'shopping', 'retail', 'clothes', 'clothing', 'fashion', 'store', 'mall', 'buy things',
    'department store', 'shoes', 'apparel', 'outfit', 'goods', 'products',
  ],
  ecommerce: [
    'ecommerce', 'e-commerce', 'online shopping', 'amazon', 'ebay', 'delivery',
  ],
  food: [
    'food', 'groceries', 'grocery', 'dinner', 'lunch', 'breakfast', 'restaurant', 'eat',
    'takeout', 'takeaway', 'meal', 'meals', 'coffee', 'fast food', 'dining', 'drinks',
  ],
  gaming: [
    'gaming', 'games', 'game', 'gamer', 'playstation', 'xbox', 'nintendo', 'steam',
    'pc game', 'console', 'video game', 'robux', 'roblox',
  ],
  entertainment: [
    'entertainment', 'streaming', 'movies', 'movie', 'tv', 'music', 'shows', 'film',
    'series', 'cinema', 'video', 'watch',
  ],
  travel: [
    'travel', 'hotel', 'hotels', 'flight', 'flights', 'vacation', 'trip', 'airline',
    'booking', 'holiday', 'ride', 'taxi', 'car rental',
  ],
  electronics: [
    'electronics', 'tech', 'gadgets', 'computer', 'laptop', 'phone', 'hardware',
  ],
}

// Common conversational filler phrases to clean up search queries
const FILLER_PHRASES = [
  /^(what\s+about\s+for\s+)/i,
  /^(what\s+about\s+)/i,
  /^(how\s+about\s+)/i,
  /^(can\s+you\s+show\s+me\s+)/i,
  /^(can\s+i\s+get\s+)/i,
  /^(can\s+i\s+buy\s+)/i,
  /^(show\s+me\s+some\s+)/i,
  /^(show\s+me\s+)/i,
  /^(i\s+want\s+to\s+buy\s+a?\s*)/i,
  /^(i\s+want\s+to\s+get\s+a?\s*)/i,
  /^(i\s+want\s+a?\s*)/i,
  /^(i'm\s+looking\s+for\s+a?\s*)/i,
  /^(looking\s+for\s+a?\s*)/i,
  /^(where\s+can\s+i\s+buy\s+)/i,
  /^(do\s+you\s+have\s+)/i,
  /^(recommend\s+me\s+some\s+)/i,
  /^(recommend\s+)/i,
  /^(give\s+me\s+)/i,
  /^(find\s+me\s+)/i,
  /^(find\s+)/i,
  /^(search\s+for\s+)/i,
  /^(search\s+)/i,
  /\s+(gift\s*card|giftcard|cards|card)$/i,
  /\s+(cards?|vouchers?|tokens?)$/i,
]

// Common brand aliases to canonical search queries
const POPULAR_BRANDS: Record<string, string> = {
  amazon: 'Amazon.com',
  target: 'Target',
  walmart: 'Walmart',
  apple: 'Apple',
  netflix: 'Netflix',
  spotify: 'Spotify',
  steam: 'Steam',
  doordash: 'DoorDash',
  uber: 'Uber',
  'uber eats': 'Uber Eats',
  airbnb: 'Airbnb',
  starbucks: 'Starbucks',
  nike: 'Nike',
  ebay: 'eBay',
  playstation: 'PlayStation Store',
  xbox: 'Xbox',
  nintendo: 'Nintendo eShop',
  roblox: 'Roblox',
  kroger: 'Kroger',
  'home depot': 'The Home Depot',
  sephora: 'Sephora',
  hulu: 'Hulu',
  chevron: 'Chevron',
  adidas: 'Adidas',
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
const AMOUNT_REGEX = /\$(\d+(?:\.\d{1,2})?)|\b(\d+(?:\.\d{1,2})?)\s*(?:usd|dollars?|usdg)\b/i
const GREETING_REGEX = /^(hi|hello|hey|yo|greetings|howdy|sup|good\s+(morning|afternoon|evening))\b/i
const BALANCE_REGEX = /\b(balance|how\s+much\s+(usdg|eth|money|crypto|funds)|my\s+wallet)\b/i
const STATUS_REGEX = /\b(order\s+status|check\s+order|track\s+order|order\s+id)\b/i

/**
 * Strips common conversational filler phrases to leave a clean, focused search term.
 */
export function cleanSearchQuery(raw: string): string {
  let cleaned = raw.trim()
  for (const regex of FILLER_PHRASES) {
    cleaned = cleaned.replace(regex, '').trim()
  }
  return cleaned
}

/**
 * Parses user input to extract intent and entities before calling any LLM.
 */
export function parseUserIntent(rawInput: string): ParsedNLP {
  const text = rawInput.trim()
  const lower = text.toLowerCase()

  // 1. Extract Email
  const emailMatch = text.match(EMAIL_REGEX)
  const email = emailMatch ? emailMatch[0] : undefined

  // 2. Extract Amount
  const amountMatch = text.match(AMOUNT_REGEX)
  let amount: number | undefined
  if (amountMatch) {
    const valStr = amountMatch[1] || amountMatch[2]
    const parsed = parseFloat(valStr)
    if (!isNaN(parsed) && parsed > 0) amount = parsed
  }

  // 3. Extract Currency
  let currency: 'USDG' | 'ETH' | undefined
  if (/\beth\b/i.test(text)) currency = 'ETH'
  else if (/\busdg\b/i.test(text)) currency = 'USDG'

  // 4. Clean Query
  const cleanQuery = cleanSearchQuery(text)

  // 5. Detect Popular Brand
  let detectedBrand: string | undefined
  for (const [key, canonical] of Object.entries(POPULAR_BRANDS)) {
    const brandRegex = new RegExp(`\\b${key}\\b`, 'i')
    if (brandRegex.test(lower)) {
      detectedBrand = canonical
      break
    }
  }

  // 6. Detect Category
  let detectedCategory: string | undefined
  for (const [catName, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const kw of keywords) {
      const kwRegex = new RegExp(`\\b${kw}\\b`, 'i')
      if (kwRegex.test(lower)) {
        detectedCategory = catName
        break
      }
    }
    if (detectedCategory) break
  }

  // 7. Intent Classification
  if (GREETING_REGEX.test(lower) && text.split(/\s+/).length <= 4) {
    return { intent: 'GREETING', cleanQuery, email, amount, currency }
  }

  if (BALANCE_REGEX.test(lower)) {
    return { intent: 'BALANCE_CHECK', cleanQuery, email, amount, currency }
  }

  if (STATUS_REGEX.test(lower)) {
    return { intent: 'STATUS_CHECK', cleanQuery, email, amount, currency }
  }

  // Checkout intent: brand + amount (and maybe email)
  if ((detectedBrand || cleanQuery.length > 2) && amount && (email || /\b(buy|get|purchase|pay|send)\b/i.test(lower))) {
    return {
      intent: 'CHECKOUT_INTENT',
      cleanQuery: detectedBrand || cleanQuery,
      brand: detectedBrand,
      amount,
      email,
      currency,
    }
  }

  // Brand search
  if (detectedBrand) {
    return {
      intent: 'BRAND_SEARCH',
      cleanQuery: detectedBrand,
      brand: detectedBrand,
      amount,
      email,
      currency,
    }
  }

  // Category search
  if (detectedCategory) {
    return {
      intent: 'CATEGORY_SEARCH',
      cleanQuery: detectedCategory,
      category: detectedCategory,
      amount,
      email,
      currency,
    }
  }

  // Fallback to brand search if cleaned query is meaningful
  if (cleanQuery.length > 1 && !/\?$/.test(cleanQuery) && cleanQuery.split(/\s+/).length <= 3) {
    return {
      intent: 'BRAND_SEARCH',
      cleanQuery,
      amount,
      email,
      currency,
    }
  }

  return {
    intent: 'UNKNOWN',
    cleanQuery,
    amount,
    email,
    currency,
  }
}
