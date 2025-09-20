'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt'
import MissionarySupport from '@/components/payments/MissionarySupport'
import PopularPostsCarousel from '@/components/home/PopularPostsCarousel'
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
    <div className="min-h-screen bg-gradient-to-br from-theme-light via-theme-secondary to-theme-primary">
      {/* 통합 헤더 섹션 */}
      <section className="container-narrow pt-16 md:pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* 통합 컨테이너 카드 */}
          <div className="bg-gradient-to-br from-white via-theme-light to-theme-secondary rounded-3xl shadow-2xl border border-theme-accent/20 overflow-hidden relative">
            {/* 장식적 요소 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-theme-accent/10 rounded-full translate-y-12 -translate-x-12"></div>
            
            {/* 상단 그라데이션 헤더 */}
            <div className="bg-gradient-to-r from-theme-primary via-theme-accent to-theme-secondary text-white py-16 px-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-theme-primary/90 via-theme-accent/90 to-theme-secondary/90"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
              <div className="relative z-10">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance drop-shadow-lg">
                  PrayGround
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                  교회 청년부를 위한 올인원 플랫폼
                </p>
              </div>
            </div>
            
            {/* 인기 게시글 섹션 */}
            <div className="p-8 bg-gradient-to-b from-white to-theme-light/30">
              <PopularPostsCarousel onPostClick={handlePostClick} />
            </div>
          </div>
        </motion.div>
      </section>


      {/* 선교사님 후원 */}
      <section className="container-narrow section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-center mb-12"
        >
          <h2 className="text-h2 text-gradient-accent mb-4">
            선교사님 후원
          </h2>
          <p className="text-body-large text-neutral-600 max-w-2xl mx-auto">
            선교사님의 사역을 위해 후원해주세요. 여러분의 기부가 선교 현장에 전달됩니다.
          </p>
        </motion.div>

        <div className="flex justify-center">
          <MissionarySupport />
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
