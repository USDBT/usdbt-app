'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LandingPage } from '@/components/LandingPage'
import { fetchProducts, type Product } from '@/lib/api'

export default function HomePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => {})
  }, [])

  return (
    <LandingPage
      products={products}
      onShop={() => router.push('/app')}
    />
  )
}
