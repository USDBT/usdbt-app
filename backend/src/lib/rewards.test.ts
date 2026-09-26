import { describe, it, expect } from 'bun:test'

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'

const { deriveReferralCode, resolveReferrer } = await import('./rewards')

describe('referral codes', () => {
  it('derives REF- plus the first 6 hex chars of the wallet', () => {
    expect(deriveReferralCode('0xAbCdEf1234567890abcdef1234567890ABCDEF12')).toBe('REF-ABCDEF')
  })

  it('rejects malformed codes without touching the database', async () => {
    for (const code of ['', 'REF-', 'REF-XYZ123', 'REF-ABCDEF1', 'ABCDEF', 'REF-ABC', null, 42]) {
      expect(await resolveReferrer(code)).toBeNull()
    }
  })
})
