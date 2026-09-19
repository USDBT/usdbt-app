import { describe, it, expect, mock } from 'bun:test'

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.RELAY_API_KEY ??= 'test-relay-key'

const insertedRows: any[] = []

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

mock.module('../lib/cryptorefills', () => ({
  requiredEnv: (name: string) => process.env[name] ?? '',
  validateOrder: async () => ({ ok: true, problems: [] }),
  createCROrder: async () => ({
    order_id: 'cr_order_1',
    order_state: 'WaitingForPayment',
    wallet_address: '0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47',
    coin_amount: '26.46',
    payment_requested_at: Math.floor(Date.now() / 1000),
  }),
}))

const relayQuoteMock = mock(async (opts: { currency: string }) => ({
  requestId: 'req_1',
  steps: [{ id: 'deposit', action: 'deposit', description: '', kind: 'transaction', items: [] }],
  details: {
    currencyIn: { currency: { symbol: opts.currency, decimals: 6, address: '0x0' }, amount: '26884521', amountFormatted: '26.884521', amountUsd: '26.88' },
    currencyOut: { amount: '26460000', amountFormatted: '26.46', amountUsd: '26.46' },
    timeEstimate: 4,
  },
}))

mock.module('../lib/relay', () => ({
  getRelayOrderQuote: relayQuoteMock,
  ROBINHOOD_CHAIN_ID: 4663,
}))

mock.module('../lib/email', () => ({
  sendDeliveryEmail: async () => {},
}))

const { createOrder } = await import('./orders')

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
  it('defaults paymentCurrency to USDG when unspecified', async () => {
    relayQuoteMock.mockClear()
    const { req, res, status, json } = mockReqRes(validBody)

    await createOrder(req, res)

    expect(relayQuoteMock).toHaveBeenCalledTimes(1)
    expect(relayQuoteMock.mock.calls[0][0].currency).toBe('USDG')
    expect(status).toHaveBeenCalledWith(201)
    expect(json.mock.calls[0][0].paymentCurrency).toBe('USDG')
  })

  it('honors paymentCurrency = ETH', async () => {
    relayQuoteMock.mockClear()
    const { req, res, json } = mockReqRes({ ...validBody, paymentCurrency: 'ETH' })

    await createOrder(req, res)

    expect(relayQuoteMock.mock.calls[0][0].currency).toBe('ETH')
    expect(json.mock.calls[0][0].paymentCurrency).toBe('ETH')
  })

  it('returns 502 when the Relay quote fails', async () => {
    relayQuoteMock.mockImplementationOnce(async () => {
      throw new Error('relay down')
    })
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
