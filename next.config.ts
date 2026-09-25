import type { NextConfig } from 'next'

const config: NextConfig = {
  // Pin the workspace root — a stray ~/pnpm-lock.yaml otherwise makes Next pick C:\Users\USER
  turbopack: { root: process.cwd() },
  webpack: (config, { dev }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    if (!dev) {
      config.cache = false
    }
    return config
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.bitrefill.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
  },
}

export default config
