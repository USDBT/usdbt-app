import type { NextConfig } from 'next'

const config: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
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
