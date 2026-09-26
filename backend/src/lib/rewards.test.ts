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

const { earnPointsFor, tierForLifetimePoints, MAX_EARN_POINTS_PER_ORDER } = await import('./rewards')
const { isUsdbtLaunched, pointsToUsdbt } = await import('./usdbt')

describe('earning points', () => {
  const base = { pointsPerUsd: 1, earnedTodayByWallet: 0, earnedThisMonthByProgram: 0, monthlyBudget: 100_000 }

  it('gives 1 point per $1 paid, rounded down', () => {
    expect(earnPointsFor({ ...base, paidUsd: 25.99 })).toBe(25)
  })

  it('applies the tier multiplier', () => {
    expect(earnPointsFor({ ...base, paidUsd: 100, multiplier: 1.5 })).toBe(150)
  })

  it('caps points per order', () => {
    expect(earnPointsFor({ ...base, paidUsd: 10_000 })).toBe(MAX_EARN_POINTS_PER_ORDER)
  })

  it('stops at the daily wallet cap and the monthly program budget', () => {
    expect(earnPointsFor({ ...base, paidUsd: 100, earnedTodayByWallet: 1950 })).toBe(50)
    expect(earnPointsFor({ ...base, paidUsd: 100, earnedTodayByWallet: 5000 })).toBe(0)
    expect(earnPointsFor({ ...base, paidUsd: 100, earnedThisMonthByProgram: 99_990 })).toBe(10)
  })

  it('never goes negative', () => {
    expect(earnPointsFor({ ...base, paidUsd: -50 })).toBe(0)
  })

  it('maps lifetime points to tiers', () => {
    expect(tierForLifetimePoints(0)).toBe('bronze')
    expect(tierForLifetimePoints(1000)).toBe('silver')
    expect(tierForLifetimePoints(5000)).toBe('gold')
    expect(tierForLifetimePoints(20000)).toBe('platinum')
  })
})

describe('$USDBT launch', () => {
  it('is off unless USDBT_LAUNCHED=true', () => {
    const before = process.env.USDBT_LAUNCHED
    delete process.env.USDBT_LAUNCHED
    expect(isUsdbtLaunched()).toBe(false)
    process.env.USDBT_LAUNCHED = 'yes'
    expect(isUsdbtLaunched()).toBe(false)
    process.env.USDBT_LAUNCHED = 'true'
    expect(isUsdbtLaunched()).toBe(true)
    if (before === undefined) delete process.env.USDBT_LAUNCHED
    else process.env.USDBT_LAUNCHED = before
  })

  it('converts points at 100 points = $1 of $USDBT', () => {
    expect(pointsToUsdbt(500, 0.25)).toEqual({ valueUsd: 5, usdbt: 20 })
  })
})
