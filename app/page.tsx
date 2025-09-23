'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt'
import MissionarySupport from '@/components/payments/MissionarySupport'
import PosterCarousel from '@/components/home/PosterCarousel'
import { Post } from '@/types'

export default function Home() {
  const router = useRouter()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // 게시글 클릭 핸들러 (이제 PopularPostsCarousel에서 직접 처리)
  const handlePostClick = (post: Post) => {
    // 이 함수는 더 이상 사용되지 않지만 호환성을 위해 유지
    window.location.href = `/board?postId=${post.id}`
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section - 인터파크 극장 스타일 */}
      <section className="relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800" />
        
        <div className="relative z-10 container mx-auto px-6 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            {/* 메인 타이틀 */}
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-orange-500 to-red-500 bg-clip-text text-transparent">
              PrayGround
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              교회 청년부를 위한 <span className="text-orange-500 font-semibold">올인원 플랫폼</span>
            </p>
          </motion.div>

          {/* 인기 게시글 포스터 캐러셀 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                🔥 <span className="text-orange-500">인기 게시글</span>
              </h2>
              <p className="text-lg text-gray-400">
                가장 많은 사랑을 받은 게시글들을 만나보세요
              </p>
            </div>
            <PosterCarousel onPostClick={handlePostClick} />
          </motion.div>
        </div>
      </section>


      {/* 선교사님 후원 - 극장 스타일 */}
      <section className="relative py-20 bg-gradient-to-r from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,53,0.1)_0%,transparent_70%)]" />
        
        <div className="relative z-10 container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              🙏 <span className="text-orange-500">선교사님 후원</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              선교사님의 사역을 위해 후원해주세요. <br />
              여러분의 <span className="text-orange-400 font-semibold">기도와 후원</span>이 선교 현장에 전달됩니다.
            </p>
            
            {/* 장식적 요소 */}
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-orange-400 font-medium">Mission Support</span>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex justify-center"
          >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-orange-500/20 shadow-2xl">
              <MissionarySupport />
            </div>
          </motion.div>
        </div>
      </section>

      {/* PWA 설치 프롬프트 */}
      <PWAInstallPrompt />

      {/* 통합 검색 모달 */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPost={(post) => {
          console.log('선택된 게시글:', post)
          setIsSearchOpen(false)
        }}
        onSelectEvent={(event) => {
          console.log('선택된 일정:', event)
          setIsSearchOpen(false)
        }}
        onSelectUser={(user) => {
          console.log('선택된 사용자:', user)
          setIsSearchOpen(false)
        }}
      />
    </div>
  )
}
