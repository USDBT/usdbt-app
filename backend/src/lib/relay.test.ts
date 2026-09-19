import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.RELAY_API_KEY ??= 'test-relay-key'
process.env.PAYMENT_WALLET_ADDRESS ??= '0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47'

const { getRelayOrderQuote, ROBINHOOD_CHAIN_ID, BASE_CHAIN_ID, ROBINHOOD_USDG_ADDRESS, NATIVE_ETH_ADDRESS, BASE_USDC_ADDRESS } =
  await import('./relay')

function mockFetchOk(): Array<{ url: string; init: RequestInit }> {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const fakeResponse = {
    requestId: 'req_123',
    steps: [{ id: 'deposit', action: 'deposit', description: '', kind: 'transaction', items: [] }],
    details: {
      currencyIn: { currency: { symbol: 'USDG', decimals: 6, address: ROBINHOOD_USDG_ADDRESS }, amount: '26884521', amountFormatted: '26.884521', amountUsd: '26.88' },
      currencyOut: { amount: '26460000', amountFormatted: '26.46', amountUsd: '26.46' },
      timeEstimate: 4,
    },
  }
  ;(globalThis as any).fetch = mock(async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(fakeResponse), { status: 200 })
  })
  return calls
}

const originalFetch = globalThis.fetch

describe('getRelayOrderQuote', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('constructs an EXACT_OUTPUT payload for USDG', async () => {
    const calls = mockFetchOk()

    await getRelayOrderQuote({
      userWallet: '0xF98a2659Fc82A3c996A5Ab10eE75ce66376De3f4',
      cryptorefillsDepositAddress: '0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47',
      cryptorefillsUsdcAmount: 26.46,
      currency: 'USDG',
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://api.relay.link/quote')
    const body = JSON.parse(calls[0].init.body as string)

    expect(body.tradeType).toBe('EXACT_OUTPUT')
    expect(body.originChainId).toBe(ROBINHOOD_CHAIN_ID)
    expect(body.destinationChainId).toBe(BASE_CHAIN_ID)
    expect(body.originCurrency).toBe(ROBINHOOD_USDG_ADDRESS)
    expect(body.destinationCurrency).toBe(BASE_USDC_ADDRESS)
    expect(body.amount).toBe('26460000')
    expect(body.appFees).toEqual([{ recipient: process.env.PAYMENT_WALLET_ADDRESS, fee: '100' }])
  })

  it('uses the native ETH address when currency is ETH', async () => {
    const calls = mockFetchOk()

    await getRelayOrderQuote({
      userWallet: '0xF98a2659Fc82A3c996A5Ab10eE75ce66376De3f4',
      cryptorefillsDepositAddress: '0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47',
      cryptorefillsUsdcAmount: 10,
      currency: 'ETH',
    })

    const body = JSON.parse(calls[0].init.body as string)
    expect(body.originCurrency).toBe(NATIVE_ETH_ADDRESS)
  })

  it('rounds the USDC amount to 6-decimal integer units', async () => {
    const calls = mockFetchOk()

    await getRelayOrderQuote({
      userWallet: '0xF98a2659Fc82A3c996A5Ab10eE75ce66376De3f4',
      cryptorefillsDepositAddress: '0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47',
      cryptorefillsUsdcAmount: '5.005',
      currency: 'USDG',
    })

    const body = JSON.parse(calls[0].init.body as string)
    expect(body.amount).toBe('5005000')
  })

  it('throws with response detail when Relay returns a non-OK status', async () => {
    ;(globalThis as any).fetch = mock(async () => new Response('bad request', { status: 400 }))

    await expect(
      getRelayOrderQuote({
        userWallet: '0xF98a2659Fc82A3c996A5Ab10eE75ce66376De3f4',
        cryptorefillsDepositAddress: '0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47',
        cryptorefillsUsdcAmount: 10,
        currency: 'USDG',
      }),
    ).rejects.toThrow('Relay quote failed (400)')
  })
})
