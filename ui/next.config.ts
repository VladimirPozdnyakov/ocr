import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  reactCompiler: false,
  devIndicators: false,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
