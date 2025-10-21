const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    buildActivity: false,
  },
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
  // CSP 설정 제거 (개발 환경에서만)
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://dapi.kakao.com https://t1.daumcdn.net https://t1.kakaocdn.net; connect-src 'self' https://dapi.kakao.com https://t1.daumcdn.net; img-src 'self' data: https: http:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https:;",
  //         },
  //       ],
  //     },
  //   ]
  // },
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
