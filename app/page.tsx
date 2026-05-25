'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ScrollText } from 'lucide-react'
import { Sidebar, type View } from '@/components/Sidebar'
import { Header, type Tab } from '@/components/Header'
import { CardCatalog } from '@/components/CardCatalog'
import { OrderForm } from '@/components/OrderForm'
import { PaymentScreen } from '@/components/PaymentScreen'
import { SuccessScreen } from '@/components/SuccessScreen'
import type { Product } from '@/lib/api'

type Step = 'catalog' | 'configure' | 'payment' | 'success'

export default function Home() {
  const { isConnected, address } = useAccount()
  const [view, setView] = useState<View>('shop')
  const [activeTab, setActiveTab] = useState<Tab>('cards')
  const [step, setStep] = useState<Step>('catalog')
  const [product, setProduct] = useState<Product | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentAddress, setPaymentAddress] = useState('')
  const [email, setEmail] = useState('')
  const [search, setSearch] = useState('')

  function reset() {
    setStep('catalog')
    setProduct(null)
    setOrderId(null)
    setPaymentAddress('')
    setEmail('')
  }

  function handleNavigate(v: View) {
    setView(v)
    reset()
    setSearch('')
  }

  const showPanel = step !== 'catalog'

  return (
    <div className="flex h-screen overflow-hidden bg-[--color-surface]">
      <Sidebar active={view} onNavigate={handleNavigate} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          search={search}
          onSearch={setSearch}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-5">
            {!isConnected ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[--color-brand-light] flex items-center justify-center mb-5">
                  <span className="text-2xl">💳</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Connect your wallet</h2>
                <p className="text-gray-400 text-xs max-w-xs leading-relaxed mb-6">
                  200+ gift cards from top brands. Pay with USDC or $USDBT on Base.
                  No KYC, no banks, delivered to your inbox.
                </p>
                <ConnectButton />
                <p className="text-[11px] text-gray-300 mt-4">No KYC · On Base · Instant delivery</p>
              </div>
            ) : view === 'shop' ? (
              <CardCatalog
                search={search}
                selectedProduct={product}
                onSelect={(p) => {
                  setProduct(p)
                  setStep('configure')
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <ScrollText size={28} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Order history coming soon.</p>
                <p className="text-[11px] text-gray-300 mt-1">Cards are delivered directly to your email.</p>
              </div>
            )}
          </main>

          {/* Right panel — order flow */}
          {showPanel && (
            <aside className="w-[280px] flex-shrink-0 border-l border-gray-100 overflow-hidden flex flex-col bg-white">
              {step === 'configure' && product && (
                <OrderForm
                  product={product}
                  walletAddress={address!}
                  onClose={reset}
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
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
