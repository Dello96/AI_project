const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'framer-motion'],
  },
  // PWA 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 환경 변수 설정
  env: {
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
  },
  // TypeScript 설정
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
}

module.exports = withPWA(nextConfig)
