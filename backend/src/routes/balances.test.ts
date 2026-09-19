import { describe, it, expect, mock } from 'bun:test'

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.RELAY_API_KEY ??= 'test-relay-key'

mock.module('../lib/simulate', () => ({
  isSimulatedAddress: (addr?: string) => addr?.toLowerCase() === '0xf98a2659fc82a3c996a5ab10ee75ce66376de3f4',
  simulateConfig: { balance: { usdc: '10.00', usdbt: '0.0000' } },
}))

const { getBalances } = await import('./balances')

function mockReqRes(address: string) {
  const req = { params: { address } } as any
  const json = mock((_x: any) => res)
  const status = mock((_code: number) => res)
  const res = { status, json } as any
  return { req, res, status, json }
}

describe('GET /balances/:address', () => {
  it('rejects an invalid address with 400', async () => {
    const { req, res, status, json } = mockReqRes('not-an-address')

    await getBalances(req, res)

    expect(status).toHaveBeenCalledWith(400)
    expect(json.mock.calls[0][0]).toEqual({ error: 'invalid address' })
  })

  it('returns { usdg, eth, chainId: 4663 } for a simulated wallet', async () => {
    const { req, res, json } = mockReqRes('0xF98a2659Fc82A3c996A5Ab10eE75ce66376De3f4')

    await getBalances(req, res)

    const payload = json.mock.calls[0][0]
    expect(payload).toMatchObject({ chainId: 4663, simulated: true })
    expect(typeof payload.usdg).toBe('string')
    expect(typeof payload.eth).toBe('string')
  })
})
