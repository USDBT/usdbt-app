import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'
import { cookieStorage, createStorage } from 'wagmi'

export const wagmiConfig = getDefaultConfig({
  appName: 'USDBT',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  chains: [base, baseSepolia],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
})
