'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const steps = [15, 40, 65, 85, 100]
    let i = 0
    const delays = [200, 250, 300, 250, 200]

    function tick() {
      if (i < steps.length) {
        const step = steps[i]
        const delay = delays[i]
        i++
        setProgress(step)
        if (i < steps.length) {
          setTimeout(tick, delay)
        } else {
          setTimeout(onDone, 350)
        }
      }
    }

    const t = setTimeout(tick, 80)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-3">
        <Image src="/logo.png" alt="$USDBT" width={52} height={52} className="rounded-2xl shadow-sm" />
        <p className="text-[17px] font-semibold text-gray-900 tracking-tight">$USDBT</p>
        <p className="text-xs text-gray-400">Gift cards on Base</p>
      </div>
      <div className="w-40 h-[3px] bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%`, backgroundColor: 'var(--color-brand)' }}
        />
      </div>
    </div>
  )
}
