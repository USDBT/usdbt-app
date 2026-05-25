'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[--color-surface-2]">
      <span className="font-bold text-lg tracking-tight text-[--color-brand]">USDBT</span>
      <ConnectButton />
    </header>
  )
}
