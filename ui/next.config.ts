import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  output: 'export',
  reactCompiler: true,
  devIndicators: false,
  images: {
    unoptimized: true,
  },
}

export default withBundleAnalyzer(nextConfig)
