import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'
import { base, baseSepolia } from 'wagmi/chains'
import { cookieStorage, createStorage } from 'wagmi'

export const robinhoodChain = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.chain.robinhood.com'] } },
  blockExplorers: {
    default: { name: 'Robinhood Explorer', url: 'https://robinhoodchain.blockscout.com' },
  },
})

export const wagmiConfig = getDefaultConfig({
  appName: 'USDBT',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  chains: [robinhoodChain, base, baseSepolia],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
})