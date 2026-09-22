import { describe, it, expect, afterEach, mock } from 'bun:test'

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.RELAY_API_KEY ??= 'test-relay-key'
process.env.PAYMENT_WALLET_ADDRESS ??= '0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47'
process.env.CRYPTOREFILLS_PARTNER_ID ??= 'test-partner-id'

const insertedRows: any[] = []

// Only mock this order's own collaborators — never '../lib/relay' or
// '../lib/cryptorefills'. bun:test's mock.module is process-wide, not per-file,
// so mocking a module also used (unmocked, or with different needs) by another
// test file corrupts that file whenever this one happens to load first (this
// is exactly what broke CI once already, and broke chat.test.ts's import of
// listBrands/getProductOptions the first time this file mocked cryptorefills
// wholesale without them). Fake the network instead — cryptorefills.ts and
// relay.ts are both thin fetch wrappers, so this exercises their real
// request-building/response-parsing code too.
mock.module('../lib/db', () => ({
  requiredEnv: (name: string) => process.env[name] ?? '',
  sql: Object.assign(
    async (_strings: TemplateStringsArray, ..._values: unknown[]) => {
      insertedRows.push(_values)
      return [{ id: 'order_1', expires_at: new Date('2026-01-01T00:00:00Z').toISOString() }]
    },
    { json: (v: unknown) => v },
  ),
}))

mock.module('../lib/email', () => ({
  sendDeliveryEmail: async () => {},
}))

const { createOrder } = await import('./orders')

const originalFetch = globalThis.fetch

function mockFetchOk(opts: { relayFails?: boolean } = {}) {
  const calls: Array<{ url: string; init: RequestInit }> = []
  ;(globalThis as any).fetch = mock(async (url: string, init: RequestInit) => {
    calls.push({ url, init })

    if (url.endsWith('/orders/validations')) {
      return new Response(JSON.stringify({ problems: [] }), { status: 200 })
    }
    if (url.endsWith('/v5/orders')) {
      return new Response(
        JSON.stringify({
          order_id: 'cr_order_1',
          order_state: 'WaitingForPayment',
          wallet_address: '0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47',
          coin_amount: '26.46',
          payment_requested_at: Math.floor(Date.now() / 1000),
        }),
        { status: 200 },
      )
    }

    // remaining call is the Relay quote (https://api.relay.link/quote)
    if (opts.relayFails) {
      return new Response('relay down', { status: 502 })
    }
    const body = JSON.parse(init.body as string)
    return new Response(
      JSON.stringify({
        requestId: 'req_1',
        steps: [{ id: 'deposit', action: 'deposit', description: '', kind: 'transaction', items: [] }],
        details: {
          currencyIn: { currency: { symbol: body.originCurrency, decimals: 6, address: body.originCurrency }, amount: '26884521', amountFormatted: '26.884521', amountUsd: '26.88' },
          currencyOut: { amount: '26460000', amountFormatted: '26.46', amountUsd: '26.46' },
          timeEstimate: 4,
        },
      }),
      { status: 200 },
    )
  })
  return calls
}

function relayCall(calls: Array<{ url: string; init: RequestInit }>) {
  const call = calls.find((c) => c.url === 'https://api.relay.link/quote')
  if (!call) throw new Error('expected a call to the Relay quote endpoint')
  return call
}

function mockReqRes(body: Record<string, unknown>) {
  const req = { body, headers: {} } as any
  const json = mock((_x: any) => res)
  const status = mock((_code: number) => res)
  const res = { status, json } as any
  return { req, res, status, json }
}

const validBody = {
  brandName: 'Uber',
  familyName: 'uber',
  denomination: 25,
  faceValue: 25,
  email: 'test@usdbt.us',
  walletAddress: '0xF98a2659Fc82A3c996A5Ab10eE75ce66376De3f4',
}

describe('POST /orders', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('defaults paymentCurrency to USDG when unspecified', async () => {
    const calls = mockFetchOk()
    const { req, res, status, json } = mockReqRes(validBody)

    await createOrder(req, res)

    expect(calls).toHaveLength(3)
    const relayBody = JSON.parse(relayCall(calls).init.body as string)
    expect(relayBody.originCurrency).toBe('0x5fc5360d0400a0fd4f2af552add042d716f1d168') // USDG, lowercased
    expect(status).toHaveBeenCalledWith(201)
    expect(json.mock.calls[0][0].paymentCurrency).toBe('USDG')
  })

  it('honors paymentCurrency = ETH', async () => {
    const calls = mockFetchOk()
    const { req, res, json } = mockReqRes({ ...validBody, paymentCurrency: 'ETH' })

    await createOrder(req, res)

    const relayBody = JSON.parse(relayCall(calls).init.body as string)
    expect(relayBody.originCurrency).toBe('0x0000000000000000000000000000000000000000')
    expect(json.mock.calls[0][0].paymentCurrency).toBe('ETH')
  })

  it('returns 502 when the Relay quote fails', async () => {
    mockFetchOk({ relayFails: true })
    const { req, res, status, json } = mockReqRes(validBody)

    await createOrder(req, res)

    expect(status).toHaveBeenCalledWith(502)
    expect(json.mock.calls[0][0].error).toMatch(/cross-chain/i)
  })

  it('rejects requests missing required fields', async () => {
    const { req, res, status } = mockReqRes({ brandName: 'Uber' })

    await createOrder(req, res)

    expect(status).toHaveBeenCalledWith(400)
  })
})
