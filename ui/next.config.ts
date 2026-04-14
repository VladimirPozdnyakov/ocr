import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  reactCompiler: true,
  devIndicators: false,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
