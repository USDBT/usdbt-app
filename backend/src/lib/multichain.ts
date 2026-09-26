// Multi-chain definitions and conversion rates for USDBT
export type SupportedChain = 'robinhood' | 'base' | 'ethereum' | 'solana'
export type SupportedCurrency = 'USDG' | 'ETH' | 'USDC' | 'USDT' | 'SOL'

export interface ChainConfig {
  id: string
  name: string
  chainId?: number
  isEvm: boolean
  currencies: Array<{
    symbol: SupportedCurrency
    name: string
    decimals: number
    address?: string
    isNative?: boolean
  }>
  explorerUrl: string
}

export const CHAINS: Record<SupportedChain, ChainConfig> = {
  robinhood: {
    id: 'robinhood',
    name: 'Robinhood Chain',
    chainId: 4663,
    isEvm: true,
    currencies: [
      { symbol: 'USDG', name: 'Global Dollar', decimals: 6, address: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168' },
      { symbol: 'ETH', name: 'Ether', decimals: 18, isNative: true },
    ],
    explorerUrl: 'https://robinhoodchain.blockscout.com',
  },
  base: {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    isEvm: true,
    currencies: [
      { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
      { symbol: 'ETH', name: 'Ether', decimals: 18, isNative: true },
    ],
    explorerUrl: 'https://basescan.org',
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum Mainnet',
    chainId: 1,
    isEvm: true,
    currencies: [
      { symbol: 'ETH', name: 'Ether', decimals: 18, isNative: true },
      { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
      { symbol: 'USDT', name: 'Tether USD', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    ],
    explorerUrl: 'https://etherscan.io',
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    isEvm: false,
    currencies: [
      { symbol: 'SOL', name: 'Solana', decimals: 9, isNative: true },
      { symbol: 'USDC', name: 'USD Coin (SPL)', decimals: 6, address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    ],
    explorerUrl: 'https://solscan.io',
  },
}

// Fixed or reference conversion rates when live oracle feeds are offline
export const REFERENCE_RATES: Record<SupportedCurrency, number> = {
  USDG: 1.0,
  USDC: 1.0,
  USDT: 1.0,
  ETH: 3200.0,
  SOL: 160.0,
}

export function convertUsdToCrypto(usdAmount: number, currency: SupportedCurrency): number {
  const rate = REFERENCE_RATES[currency] || 1.0
  const cryptoAmount = usdAmount / rate
  if (currency === 'ETH') return parseFloat(cryptoAmount.toFixed(6))
  if (currency === 'SOL') return parseFloat(cryptoAmount.toFixed(4))
  return parseFloat(cryptoAmount.toFixed(2))
}

export function generateSolanaDepositAddress(orderId: string): string {
  // Deterministic clean mock Solana base58 address for order settlement
  const hash = Array.from(orderId.replace(/-/g, ''))
    .map((c) => c.charCodeAt(0).toString(16))
    .join('')
    .slice(0, 32)
  return `USDBT${hash.slice(0, 20)}Sol111`
}

export function formatSolanaPayUri(opts: {
  address: string
  amount: number
  orderId: string
  brandName: string
}): string {
  const label = encodeURIComponent(`USDBT - ${opts.brandName}`)
  const message = encodeURIComponent(`Payment for Order #${opts.orderId.slice(0, 8)}`)
  return `solana:${opts.address}?amount=${opts.amount}&label=${label}&message=${message}&memo=${opts.orderId}`
}
