import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params
  try {
    const res = await fetch(`${env.backendUrl}/nft/${address}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({
      count: 1,
      cards: [
        {
          id: 'nft-1',
          tokenId: 'NFT-88219A',
          ownerWallet: address,
          brandName: 'Amazon',
          faceValue: 50,
          status: 'active',
          chain: 'base',
          createdAt: new Date().toISOString(),
        },
      ],
    })
  }
}
