'use client'

import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider, cookieToInitialState } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { wagmiConfig } from '@/lib/wagmi'
import '@rainbow-me/rainbowkit/styles.css'
import { useState } from 'react'

export function Providers({ children, cookie }: { children: React.ReactNode; cookie?: string | null }) {
  const [queryClient] = useState(() => new QueryClient())
  const initialState = cookieToInitialState(wagmiConfig, cookie)

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <WagmiProvider config={wagmiConfig} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={lightTheme({
              accentColor: '#2b2bf5',
              accentColorForeground: 'white',
              borderRadius: 'medium',
            })}
          >
            {children}
            <Toaster position="bottom-right" richColors />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}
