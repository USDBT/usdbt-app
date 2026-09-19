import { describe, it, expect, mock } from 'bun:test'

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.RELAY_API_KEY ??= 'test-relay-key'

// A dedicated address, distinct from the shared test wallet other test files use for
// "real" (non-simulated) flows — bun:test's mock.module is process-wide, not per-file,
// so reusing that address here would make it look simulated wherever this mock leaks.
const SIMULATED_TEST_ADDRESS = '0x1111111111111111111111111111111111111111'

mock.module('../lib/simulate', () => ({
  isSimulatedAddress: (addr?: string) => addr?.toLowerCase() === SIMULATED_TEST_ADDRESS,
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
    const { req, res, json } = mockReqRes(SIMULATED_TEST_ADDRESS)

    await getBalances(req, res)

    const payload = json.mock.calls[0][0]
    expect(payload).toMatchObject({ chainId: 4663, simulated: true })
    expect(typeof payload.usdg).toBe('string')
    expect(typeof payload.eth).toBe('string')
  })
})
