import { describe, it, expect, mock } from 'bun:test'

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.RELAY_API_KEY ??= 'test-relay-key'
process.env.PAYMENT_WALLET_ADDRESS ??= '0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47'
process.env.CRYPTOREFILLS_PARTNER_ID ??= 'test-partner-id'

import { calculateTier } from './loyalty'
import { convertUsdToCrypto, generateSolanaDepositAddress } from '../lib/multichain'

describe('Features: Loyalty, Multi-chain, Bulk, Referrals', () => {
  it('calculates correct loyalty tiers based on lifetime points', () => {
    expect(calculateTier(0).tier).toBe('bronze')
    expect(calculateTier(1500).tier).toBe('silver')
    expect(calculateTier(6000).tier).toBe('gold')
    expect(calculateTier(25000).tier).toBe('platinum')
    expect(calculateTier(25000).perkDiscountPct).toBe(5)
  })

  it('converts USD to crypto accurately across chains', () => {
    expect(convertUsdToCrypto(100, 'USDC')).toBe(100)
    expect(convertUsdToCrypto(100, 'USDG')).toBe(100)
    expect(convertUsdToCrypto(320, 'ETH')).toBe(0.1)
    expect(convertUsdToCrypto(160, 'SOL')).toBe(1.0)
  })

  it('generates deterministic valid Solana deposit addresses', () => {
    const addr = generateSolanaDepositAddress('test-order-uuid-1234')
    expect(addr.startsWith('USDBT')).toBe(true)
    expect(addr.length).toBeGreaterThan(15)
  })
})
