import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: '$USDBT — Spend the Meme',
  description: 'Non-KYC gift cards on Base. Pay with USDC or $USDBT. 200+ brands, no paperwork.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
