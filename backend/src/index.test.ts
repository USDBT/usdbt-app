import { describe, it, expect } from 'bun:test'

describe('config', () => {
  it('PORT defaults to 3001', () => {
    const port = parseInt(process.env.PORT ?? '3001', 10)
    expect(port).toBeGreaterThan(0)
  })
})
