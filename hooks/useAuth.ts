'use client'

import { useState, useCallback } from 'react'
import { useSignMessage } from 'wagmi'
import {
  getValidToken, fetchNonce, verifySignature, storeToken,
} from '@/lib/auth'

export type AuthState = 'idle' | 'signing' | 'verified' | 'error'

export function useAuth() {
  const [state, setState] = useState<AuthState>('idle')
  const { signMessageAsync } = useSignMessage()

  const authenticate = useCallback(async (address: string): Promise<string | null> => {
    // Return existing token if still valid
    const existing = getValidToken()
    if (existing) {
      setState('verified')
      return existing
    }

    setState('signing')
    try {
      const nonce = await fetchNonce(address)
      const message = [
        '$USDBT — Sign in',
        '',
        `Address: ${address}`,
        `Nonce: ${nonce}`,
        `Issued: ${new Date().toISOString()}`,
        '',
        'This signature proves ownership of your wallet. No transaction will be made.',
      ].join('\n')

      const signature = await signMessageAsync({ message })
      const token = await verifySignature(address, signature, message)
      storeToken(token)
      setState('verified')
      return token
    } catch (err: any) {
      // User rejected signing
      setState('error')
      return null
    }
  }, [signMessageAsync])

  function reset() {
    setState('idle')
  }

  return { state, authenticate, reset }
}
