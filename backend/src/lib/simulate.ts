export const SIMULATE = process.env.SIMULATE === 'true'

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
