'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CalendarIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon,
  UserGroupIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/notifications/NotificationBell'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt'
import PaymentTest from '@/components/payments/PaymentTest'
import PopularPostsCarousel from '@/components/home/PopularPostsCarousel'
import { Post } from '@/types'

export default function Home() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  // 게시글 클릭 핸들러
  const handlePostClick = (post: Post) => {
    setSelectedPost(post)
    // 게시판 페이지로 이동하고 해당 게시글을 선택하도록 상태 전달
    router.push(`/board?postId=${post.id}`)
  }

  const baseFeatures = [
    {
      icon: DocumentTextIcon,
      title: '공지사항',
      description: '교회 공지와 소식을 한눈에 확인하세요',
      color: 'from-theme-primary to-theme-accent',
      href: '/board'
    },
    {
      icon: CalendarIcon,
      title: '일정관리',
      description: '예배, 행사, 소그룹 일정을 체계적으로 관리하세요',
      color: 'from-theme-secondary to-theme-primary',
      href: '/calendar'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: '소통공간',
      description: '청년부 성도들과 자유롭게 소통하고 교제하세요',
      color: 'from-theme-accent to-theme-primary',
      href: '/chat'
    },
    {
      icon: UserGroupIcon,
      title: '소그룹',
      description: '소그룹별 활동과 자료를 공유하고 관리하세요',
      color: 'from-theme-primary to-theme-secondary',
      href: '/groups'
    }
  ]

  // 관리자 전용 기능 추가
  const adminFeatures = [
    {
      icon: Cog6ToothIcon,
      title: '관리자 대시보드',
      description: '사용자 관리 및 권한 설정을 진행하세요',
      color: 'from-red-500 to-red-600',
      href: '/admin'
    }
  ]

  const features = baseFeatures

  const quickActions = [
    { title: '공지사항 작성', icon: DocumentTextIcon, variant: 'default' as const },
    { title: '일정 등록', icon: CalendarIcon, variant: 'secondary' as const },
    { title: '알림 설정', icon: BellIcon, variant: 'accent' as const },
    { title: '설정', icon: Cog6ToothIcon, variant: 'outline' as const }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-light via-theme-secondary to-theme-primary">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-primary text-white shadow-large">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container-narrow pt-16 md:pt-24 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-balance">
              PrayGround
            </h1>
          </motion.div>
        </div>
      </section>

      {/* 인기 게시글 캐러셀 */}
      <section className="container-narrow -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <PopularPostsCarousel onPostClick={handlePostClick} />
        </motion.div>
      </section>

      {/* 주요 기능 */}
      <section className="container-narrow section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-h2 text-gradient-primary mb-4">
            주요 기능
          </h2>
          <p className="text-body-large text-neutral-600 max-w-2xl mx-auto">
            청년부 활동에 필요한 모든 기능을 한 곳에서 제공합니다
          </p>
        </motion.div>

        <div className="card-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card 
                variant="elevated" 
                className="h-full cursor-pointer group hover:scale-105 transition-transform duration-300"
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white shadow-medium group-hover:shadow-glow transition-all duration-300`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-h4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-body text-neutral-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 빠른 액션 */}
      <section className="container-narrow section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-h2 text-gradient-secondary mb-4">
            빠른 액션
          </h2>
          <p className="text-body-large text-neutral-600 max-w-2xl mx-auto">
            자주 사용하는 기능에 빠르게 접근하세요
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Button
                variant={action.variant}
                size="lg"
                className="w-full h-16 flex-col gap-2"
                icon={<action.icon className="w-6 h-6" />}
                iconPosition="left"
              >
                {action.title}
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 통계 */}
      <section className="container-narrow section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-h2 text-gradient-accent mb-4">
            커뮤니티 현황
          </h2>
          <p className="text-body-large text-neutral-600 max-w-2xl mx-auto">
            청년부 커뮤니티의 활발한 활동을 확인해보세요
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: '활성 멤버', value: '80+', color: 'from-primary-500 to-primary-600' },
            { label: '주간 게시글', value: '50+', color: 'from-secondary-500 to-secondary-600' },
            { label: '이번 달 일정', value: '25+', color: 'from-accent-500 to-accent-600' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card variant="church" className="text-center">
                <CardContent className="pt-8 pb-6">
                  <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                    {stat.value}
                  </div>
                  <p className="text-body text-neutral-600">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 결제 테스트 */}
      <section className="container-narrow section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-center mb-12"
        >
          <h2 className="text-h2 text-gradient-accent mb-4">
            결제 시스템 테스트
          </h2>
          <p className="text-body-large text-neutral-600 max-w-2xl mx-auto">
            토스페이먼츠를 통한 안전한 결제 시스템을 테스트해보세요
          </p>
        </motion.div>

        <div className="flex justify-center">
          <PaymentTest />
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
