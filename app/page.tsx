'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Header } from '@/components/Header'
import { CardCatalog } from '@/components/CardCatalog'
import { OrderForm } from '@/components/OrderForm'
import { PaymentScreen } from '@/components/PaymentScreen'
import { SuccessScreen } from '@/components/SuccessScreen'
import type { Product } from '@/lib/api'

type Step = 'catalog' | 'configure' | 'payment' | 'success'

export default function Home() {
  const { isConnected, address } = useAccount()
  const [step, setStep] = useState<Step>('catalog')
  const [product, setProduct] = useState<Product | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentAddress, setPaymentAddress] = useState('')
  const [email, setEmail] = useState('')

  function reset() {
    setStep('catalog')
    setProduct(null)
    setOrderId(null)
    setPaymentAddress('')
    setEmail('')
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Spend the meme.</h1>
          <p className="text-gray-500 mb-8 max-w-sm text-sm leading-relaxed">
            Connect your wallet to get 200+ gift cards delivered instantly.
            Pay with USDC or $USDBT on Base. No KYC.
          </p>
          <ConnectButton />
          <p className="text-xs text-gray-400 mt-5">No KYC · No banks · No paperwork</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {step === 'catalog' && (
        <CardCatalog
          onSelect={(p) => {
            setProduct(p)
            setStep('configure')
          }}
        />
      )}

      {step === 'configure' && product && (
        <OrderForm
          product={product}
          walletAddress={address!}
          onBack={() => setStep('catalog')}
          onOrder={(id, addr, mail) => {
            setOrderId(id)
            setPaymentAddress(addr)
            setEmail(mail)
            setStep('payment')
          }}
        />
      )}

      {step === 'payment' && orderId && (
        <PaymentScreen
          orderId={orderId}
          paymentAddress={paymentAddress}
          email={email}
          onSuccess={() => setStep('success')}
        />
      )}

      {step === 'success' && (
        <SuccessScreen email={email} onReset={reset} />
      )}
    </div>
  )
}
