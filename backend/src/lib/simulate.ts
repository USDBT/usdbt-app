export const SIMULATE = process.env.SIMULATE === 'true'

export const SIMULATE_WHITELIST = new Set([
  '0xF98a2659Fc82A3c996A5Ab10eE75ce66376De3f4'.toLowerCase(),
  '0xa6F1C2972516bfD28Cb1a4446e57CA766b6ed456'.toLowerCase(),
])

export function isSimulatedAddress(address?: string): boolean {
  if (!address) return false
  return SIMULATE && SIMULATE_WHITELIST.has(address.toLowerCase())
}

export const simulateConfig = {
  balance: {
    usdc: '10.00',
    usdbt: '0.0000',
  },
  fulfillmentDelayMs: 6000,
  paymentAddress: '0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47',
}

export function simulatedCoinAmount(faceValue: number): number {
  return parseFloat((faceValue * 1.0064).toFixed(2))
}
