import { zeroAddress } from 'viem'
import { requiredEnv } from './db'

const RELAY_API_BASE = 'https://api.relay.link'

export const ROBINHOOD_CHAIN_ID = Number(process.env.ROBINHOOD_CHAIN_ID ?? 4663)
export const BASE_CHAIN_ID = Number(process.env.BASE_CHAIN_ID ?? 8453)

export const ROBINHOOD_USDG_ADDRESS = (
  process.env.ROBINHOOD_USDG_ADDRESS ?? '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168'
).toLowerCase()

export const NATIVE_ETH_ADDRESS = zeroAddress

export const BASE_USDC_ADDRESS = (
  process.env.USDC_TOKEN_ADDRESS ?? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
).toLowerCase()

export type RelayPaymentCurrency = 'USDG' | 'ETH'

export interface RelayStepItem {
  status: 'incomplete' | 'complete'
  data: {
    from?: string
    to: string
    data: string
    value: string
    chainId: number
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
  }
}

export interface RelayStep {
  id: 'approve' | 'deposit' | string
  action: string
  description: string
  kind: 'transaction' | 'signature'
  items: RelayStepItem[]
}

export interface RelayQuoteResponse {
  requestId: string
  steps: RelayStep[]
  details: {
    currencyIn: {
      currency: {
        symbol: string
        decimals: number
        address: string
      }
      amount: string
      amountFormatted: string
      amountUsd: string
    }
    currencyOut: {
      amount: string
      amountFormatted: string
      amountUsd: string
    }
    timeEstimate: number
  }
}

/**
 * EXACT_OUTPUT cross-chain quote: pays in USDG/ETH on Robinhood Chain, delivers
 * exact USDC on Base to Cryptorefills' deposit address. Relay takes a 1% cut
 * of the input into PAYMENT_WALLET_ADDRESS via appFees.
 */
export async function getRelayOrderQuote(opts: {
  userWallet: string
  cryptorefillsDepositAddress: string
  cryptorefillsUsdcAmount: number | string
  currency: RelayPaymentCurrency
}): Promise<RelayQuoteResponse> {
  const { userWallet, cryptorefillsDepositAddress, cryptorefillsUsdcAmount, currency } = opts

  const amountUnits = Math.round(Number(cryptorefillsUsdcAmount) * 1e6).toString()
  const originCurrency = currency === 'ETH' ? NATIVE_ETH_ADDRESS : ROBINHOOD_USDG_ADDRESS

  const payload: Record<string, unknown> = {
    user: userWallet,
    recipient: cryptorefillsDepositAddress,
    originChainId: ROBINHOOD_CHAIN_ID,
    destinationChainId: BASE_CHAIN_ID,
    originCurrency,
    destinationCurrency: BASE_USDC_ADDRESS,
    amount: amountUnits,
    tradeType: 'EXACT_OUTPUT',
  }

  const treasuryAddress = process.env.PAYMENT_WALLET_ADDRESS
  if (treasuryAddress) {
    payload.appFees = [
      {
        recipient: treasuryAddress,
        fee: '100', // 100 bps = 1.00% USDBT platform fee
      },
    ]
  }

  const res = await fetch(`${RELAY_API_BASE}/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': requiredEnv('RELAY_API_KEY'),
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Relay quote failed (${res.status}): ${errText}`)
  }

  return res.json() as Promise<RelayQuoteResponse>
}
