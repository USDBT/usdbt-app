import { describe, it, expect } from 'bun:test'
import { parseUserIntent, cleanSearchQuery } from './nlp'

describe('NLP Pre-Processor', () => {
  it('detects category queries like "what about for shopping"', () => {
    const res = parseUserIntent('what about for shopping')
    expect(res.intent).toBe('CATEGORY_SEARCH')
    expect(res.category).toBe('shopping')
  })

  it('detects food and dining categories', () => {
    const res = parseUserIntent('show me some food cards')
    expect(res.intent).toBe('CATEGORY_SEARCH')
    expect(res.category).toBe('food')
  })

  it('detects brand searches and cleans filler phrases', () => {
    const res = parseUserIntent('can I buy a netflix gift card?')
    expect(res.intent).toBe('BRAND_SEARCH')
    expect(res.brand).toBe('Netflix')
  })

  it('detects checkout intent with amount, brand, and email', () => {
    const res = parseUserIntent('Buy $25 DoorDash for test@example.com in USDG')
    expect(res.intent).toBe('CHECKOUT_INTENT')
    expect(res.brand).toBe('DoorDash')
    expect(res.amount).toBe(25)
    expect(res.email).toBe('test@example.com')
    expect(res.currency).toBe('USDG')
  })

  it('detects greetings', () => {
    const res = parseUserIntent('hey there')
    expect(res.intent).toBe('GREETING')
  })

  it('detects balance queries', () => {
    const res = parseUserIntent('how much usdg do i have in my wallet')
    expect(res.intent).toBe('BALANCE_CHECK')
    expect(res.currency).toBe('USDG')
  })

  it('cleans filler words from raw search query', () => {
    expect(cleanSearchQuery('what about for shopping')).toBe('shopping')
    expect(cleanSearchQuery('can you show me amazon gift card')).toBe('amazon')
    expect(cleanSearchQuery('where can i buy steam cards')).toBe('steam')
  })
})
