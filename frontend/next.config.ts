import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output bundles everything needed to run the server —
  // copy .next/standalone to production and start with `node server.js`.
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img3.creatium.ru',
      },
    ],
  },
}

export default nextConfig
