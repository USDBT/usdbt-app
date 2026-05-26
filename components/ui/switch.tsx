'use client'

import * as SwitchPrimitive from '@radix-ui/react-switch'
import { forwardRef } from 'react'

export const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className="peer inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#2b2bf5] data-[state=unchecked]:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2bf5] focus-visible:ring-offset-2"
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
))
Switch.displayName = 'Switch'
