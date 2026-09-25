import { Suspense } from 'react'
import { AppWorkspace } from '@/components/AppWorkspace'

export const metadata = {
  title: 'App — $USDBT',
  description: 'Spend USDG and ETH on non-KYC digital gift cards and virtual cards on Robinhood Chain.',
}

export default function AppPage() {
  console.log('>>> [SERVER] HIT /app -> RENDERING APP WORKSPACE <<<')
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#f4f5f9]">
          <div className="w-8 h-8 rounded-full border-2 border-[#2b2bf5] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AppWorkspace initialView="shop" />
    </Suspense>
  )
}
