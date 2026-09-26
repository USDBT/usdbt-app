import { describe, it, expect, afterEach, mock } from 'bun:test'

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.RELAY_API_KEY ??= 'test-relay-key'
process.env.GROQ_API_KEY ??= 'test-groq-key'
process.env.PAYMENT_WALLET_ADDRESS ??= '0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47'

// Deliberately no mock.module() here — bun:test's mock.module is process-wide,
// not per-file (see orders.test.ts's note), and chat.ts shares '../lib/db' and
// '../lib/cryptorefills' with other test files. Faking global.fetch instead
// exercises the real cryptorefills.ts/relay.ts parsing logic and can't leak
// into any other file's module mocks.

const { executeTool, handleChat } = await import('./chat')

const originalFetch = globalThis.fetch

function mockFetchJson(body: unknown, status = 200) {
  ;(globalThis as any).fetch = mock(async () => new Response(JSON.stringify(body), { status }))
}

function mockReqRes(body: Record<string, unknown>) {
  const req = { body, headers: {} } as any
  const json = mock((_x: any) => res)
  const status = mock((_code: number) => res)
  const res = { status, json } as any
  return { req, res, status, json }
}

function mockSseRes(body: Record<string, unknown>) {
  const writes: string[] = []
  const req = { body, headers: {} } as any
  const res = {
    setHeader: mock(() => {}),
    write: mock((chunk: string) => {
      writes.push(chunk)
      return true
    }),
    end: mock(() => {}),
  } as any
  return { req, res, writes }
}

describe('POST /chat', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns 400 if messages array is missing or empty', async () => {
    const { req, res, status } = mockReqRes({})
    await handleChat(req, res)
    expect(status).toHaveBeenCalledWith(400)

    const { req: req2, res: res2, status: status2 } = mockReqRes({ messages: [] })
    await handleChat(req2, res2)
    expect(status2).toHaveBeenCalledWith(400)
  })

  it('returns a clean error SSE chunk when Groq responds non-OK, instead of crashing', async () => {
    mockFetchJson({ error: 'rate limited' }, 429)
    const { req, res, writes } = mockSseRes({ messages: [{ role: 'user', content: 'hi' }] })

    await handleChat(req, res)

    expect(res.end).toHaveBeenCalled()
    const errorChunk = writes.find((w) => w.includes('"type":"error"'))
    expect(errorChunk).toBeDefined()
    expect(writes.at(-1)).toBe('data: [DONE]\n\n')
  })
})

describe('executeTool', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('searchBrands returns matching brands and a brand_carousel widget', async () => {
    mockFetchJson({
      categories: [
        {
          kind: 'giftcard',
          category: 'entertainment',
          brands: [
            { family: 'netflix-us', brand: 'Netflix', logo_url: 'https://x/netflix.png', logo_base_url: 'https://x/netflix', min: '$10', max: '$100', is_out_of_stock: false },
            { family: 'hulu-us', brand: 'Hulu', logo_url: 'https://x/hulu.png', is_out_of_stock: false },
          ],
        },
      ],
    })

    const result = await executeTool('searchBrands', { query: 'netflix' }, {})

    expect(result.widget).toBe('brand_carousel')
    expect(result.matches).toEqual([
      { id: 'netflix-us', name: 'Netflix', categories: ['entertainment'], image: 'https://x/netflix.webp' },
    ])
  })

  it('getBrandDetails returns fixed denominations and a denomination_picker widget', async () => {
    mockFetchJson([
      {
        products: [
          { product_id: 'p1', denomination: '25 USD', coin_amount: '25.16', is_dynamic: false, face_value: { currency_code: 'USD', amount: { type: 'fixed', price: '25' } } },
          { product_id: 'p2', denomination: '50 USD', coin_amount: '50.32', is_dynamic: false, face_value: { currency_code: 'USD', amount: { type: 'fixed', price: '50' } } },
        ],
      },
    ])

    const result = await executeTool('getBrandDetails', { familyName: 'netflix-us' }, {})

    expect(result.widget).toBe('denomination_picker')
    expect(result.denominations).toEqual([25, 50])
  })

  it('buildPendingIntent constructs an order_intent with chainId 4663 — and never returns executable steps', async () => {
    mockFetchJson({
      requestId: 'req_1',
      steps: [{ id: 'deposit', action: 'deposit', description: '', kind: 'transaction', items: [] }],
      details: {
        currencyIn: { currency: { symbol: 'USDG', decimals: 6, address: '0x0' }, amount: '26884521', amountFormatted: '26.884521', amountUsd: '26.88' },
        currencyOut: { amount: '26460000', amountFormatted: '26.46', amountUsd: '26.46' },
        timeEstimate: 4,
      },
    })

    const result = await executeTool(
      'buildPendingIntent',
      { familyName: 'netflix-us', brandName: 'Netflix', faceValue: 25, email: 'me@usdbt.us', paymentCurrency: 'USDG' },
      {},
    )

    expect(result.widget).toBe('order_intent')
    expect(result.intent.chainId).toBe(4663)
    expect(result.intent.paymentAmount).toBe(26.884521)
    expect(result.intent.requiresOrderCreation).toBe(true)
    // The Relay quote here prices against a placeholder recipient (the
    // treasury wallet) purely to estimate an amount — its `steps` would
    // deposit to the wrong address if ever executed. Never surface them.
    expect(result.intent.steps).toBeUndefined()
  })

  it('buildPendingIntent rejects an invalid email before quoting', async () => {
    const result = await executeTool(
      'buildPendingIntent',
      { familyName: 'netflix-us', faceValue: 25, email: 'not-an-email' },
      {},
    )
    expect(result.error).toMatch(/email/i)
  })
})

describe('summarizeToolResultForLLM', () => {
  const { summarizeToolResultForLLM } = require('./chat')

  it('strips bulky image URLs and categories from searchBrands', () => {
    const raw = {
      matches: [
        { id: 'target-us', name: 'Target', categories: ['shopping'], image: 'https://cdn.example.com/target-logo-very-long-url.webp' },
        { id: 'kroger-us', name: 'Kroger', categories: ['grocery'], image: 'https://cdn.example.com/kroger-logo-very-long-url.webp' },
      ],
      widget: 'brand_carousel',
    }

    const summary = JSON.parse(summarizeToolResultForLLM('searchBrands', raw))
    expect(summary.found).toBe(2)
    expect(summary.brands).toEqual(['Target (id:target-us)', 'Kroger (id:kroger-us)'])
    expect(JSON.stringify(summary)).not.toContain('https://')
    expect(JSON.stringify(summary)).not.toContain('image')
  })

  it('summarizes denomination details to array only', () => {
    const raw = { familyName: 'netflix-us', denominations: [10, 25, 50, 100], widget: 'denomination_picker' }
    const summary = JSON.parse(summarizeToolResultForLLM('getBrandDetails', raw))
    expect(summary).toEqual({ brand: 'netflix-us', denominations: [10, 25, 50, 100] })
  })

  it('summarizes checkout intent to core fields', () => {
    const raw = {
      intent: { brandName: 'Netflix', faceValue: 25, email: 'a@b.com', paymentAmount: 26.5, paymentCurrency: 'USDG' },
      widget: 'order_intent',
    }
    const summary = JSON.parse(summarizeToolResultForLLM('buildPendingIntent', raw))
    expect(summary).toEqual({ ready: true, brand: 'Netflix', value: 25, email: 'a@b.com', pay: '26.5 USDG' })
  })
})
