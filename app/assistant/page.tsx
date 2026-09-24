import { Suspense } from 'react'
import { AppWorkspace } from '@/components/AppWorkspace'

export const metadata = {
  title: 'AI Shopping Assistant — $USDBT',
  description: 'Converse with the USDBT AI Shopping Assistant to find and buy gift cards non-custodially on Robinhood Chain.',
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#f4f5f9]">
          <div className="w-8 h-8 rounded-full border-2 border-[#2b2bf5] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AppWorkspace initialView="assistant" />
    </Suspense>
  )
}
