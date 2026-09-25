'use client'

import { useCallback } from 'react'
import { BaseError, InsufficientFundsError, UserRejectedRequestError, type Address, type Hex } from 'viem'
import { useAccount, usePublicClient, useSendTransaction, useSwitchChain } from 'wagmi'
import type { OrderCreated } from './api'

export const ROBINHOOD_CHAIN_ID = 4663

// Runs the Relay steps returned by POST /orders: switch to Robinhood Chain, then send each
// incomplete transaction from the connected wallet and wait for it to confirm.
export function useRelayPayment() {
  const { address, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { sendTransactionAsync } = useSendTransaction()
  const publicClient = usePublicClient({ chainId: ROBINHOOD_CHAIN_ID })

  return useCallback(async (order: OrderCreated, onStep?: (description: string) => void) => {
    if (!address) throw new Error('Connect your wallet to pay.')
    if (order.chainId && order.chainId !== ROBINHOOD_CHAIN_ID) throw new Error('The payment route returned an unexpected network.')
    const steps = Array.isArray(order.steps) ? order.steps : []
    if (steps.length === 0) throw new Error('This order has no payment steps. Start a new order.')

    if (chainId !== ROBINHOOD_CHAIN_ID) await switchChainAsync({ chainId: ROBINHOOD_CHAIN_ID })

    for (const step of steps) {
      if (step.kind !== 'transaction') throw new Error('This payment route requested an unsupported signature step.')
      for (const item of step.items ?? []) {
        if (item.status === 'complete') continue
        const data = item.data
        if (data.chainId !== ROBINHOOD_CHAIN_ID) throw new Error('A payment step returned an unexpected network.')
        onStep?.(step.description || 'Approve this step in your wallet.')
        const hash = await sendTransactionAsync({
          account: address as Address,
          chainId: ROBINHOOD_CHAIN_ID,
          to: data.to as Address,
          data: data.data as Hex,
          value: BigInt(data.value || '0'),
          ...(data.maxFeePerGas ? { maxFeePerGas: BigInt(data.maxFeePerGas) } : {}),
          ...(data.maxPriorityFeePerGas ? { maxPriorityFeePerGas: BigInt(data.maxPriorityFeePerGas) } : {}),
        })
        if (!publicClient) throw new Error('Robinhood Chain is unavailable in this wallet session.')
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        if (receipt.status !== 'success') throw new Error('A payment transaction was reverted.')
      }
    }
  }, [address, chainId, switchChainAsync, sendTransactionAsync, publicClient])
}

// Wallet and RPC errors arrive as long technical dumps (request args, calldata, viem
// versions). Map the common ones to plain language and never show the raw dump.
export function paymentErrorMessage(err: unknown, fallback = 'Payment could not be completed. Try again.'): string {
  if (!(err instanceof Error)) return fallback
  const cause = (err instanceof BaseError
    ? err.walk((e) => {
        const code = (e as { code?: unknown }).code
        return e instanceof UserRejectedRequestError || code === 4001 || code === 4902 || e instanceof InsufficientFundsError
      })
    : err) as (Error & { code?: unknown }) | null
  const text = err.message

  if (cause instanceof UserRejectedRequestError || cause?.code === 4001 || /user (rejected|denied)|rejected the request/i.test(text)) {
    return 'You cancelled the request in your wallet. Try again when you are ready.'
  }
  if (cause?.code === 4902) {
    return 'Your wallet does not have Robinhood Chain yet. Add it in your wallet, then try again.'
  }
  if (cause instanceof InsufficientFundsError || /insufficient funds|exceeds balance/i.test(text)) {
    return 'Your wallet does not have enough funds on Robinhood Chain to cover this payment and the network fee.'
  }
  if (/fetch failed|network|timed? ?out|HTTP request failed/i.test(text)) {
    return 'Could not reach Robinhood Chain. Check your connection and try again.'
  }
  if (err instanceof BaseError) return err.shortMessage || fallback
  return text ? text.split('\n')[0] : fallback
}

export function formatAmount(value: number, currency: 'USDG' | 'ETH'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currency === 'ETH' ? 0 : 2,
    maximumFractionDigits: currency === 'ETH' ? 6 : 2,
  }).format(value)
  return `${formatted} ${currency}`
}
