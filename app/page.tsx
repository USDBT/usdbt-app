import type { Metadata } from 'next'
import { LandingPageClient } from '@/components/LandingPageClient'

export const metadata: Metadata = {
  title: '$USDBT — Spend the Meme · Non-KYC Gift Cards',
  description: 'Spend USDG and ETH on 500+ digital gift cards on Robinhood Chain. No KYC, instant delivery.',
}

export default function HomePage() {
  return <LandingPageClient />
}
