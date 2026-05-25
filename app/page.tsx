'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Header } from '@/components/Header'
import { CreditCard, Gift } from 'lucide-react'

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {isConnected ? <Dashboard /> : <ConnectPrompt />}
    </div>
  )
}

function ConnectPrompt() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-3">
        Spend the meme.
      </h1>
      <p className="text-gray-500 mb-8 max-w-sm text-sm leading-relaxed">
        Connect your wallet to get a non-KYC virtual card or 200+ gift cards.
        Pay with USDC or $USDBT on Base.
      </p>
      <ConnectButton />
      <p className="text-xs text-gray-400 mt-5">No KYC · No banks · No paperwork</p>
    </main>
  )
}

function Dashboard() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Get a card</h1>
        <p className="text-gray-500 text-sm mt-1">
          Choose your card type and pay with USDC or $USDBT on Base.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardOption
          icon={<CreditCard size={20} />}
          label="01"
          title="Virtual Visa Card"
          description="Spend anywhere Visa is accepted. Works with Apple Pay and Google Pay."
          fee="2% with $USDBT · 4% with USDC"
        />
        <CardOption
          icon={<Gift size={20} />}
          label="02"
          title="Gift Cards"
          description="Amazon, Netflix, Steam, Uber, Spotify and 200+ more. Delivered instantly."
          fee="2% with $USDBT · 4% with USDC"
        />
      </div>
    </main>
  )
}

function CardOption({
  icon,
  label,
  title,
  description,
  fee,
}: {
  icon: React.ReactNode
  label: string
  title: string
  description: string
  fee: string
}) {
  return (
    <button className="group text-left p-6 rounded-2xl border border-[--color-surface-2] bg-[--color-surface] hover:border-[--color-brand] hover:bg-white transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[--color-brand] flex items-center justify-center text-white">
          {icon}
        </div>
        <span className="text-sm font-mono text-gray-400">{label}</span>
      </div>
      <h2 className="font-semibold text-lg mb-1">{title}</h2>
      <p className="text-gray-500 text-sm mb-3 leading-relaxed">{description}</p>
      <span className="text-xs text-gray-400">{fee}</span>
    </button>
  )
}
