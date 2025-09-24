'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import AuthModal from '@/components/auth/AuthModal'
import KakaoLoginButton from '@/components/auth/KakaoLoginButton'
import Logo from '@/components/ui/Logo'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { user, isLoading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // 이미 로그인된 사용자는 리다이렉트
  useEffect(() => {
    if (!isLoading && user) {
      router.push(redirect)
    }
  }, [user, isLoading, router, redirect])

  const handleKakaoSuccess = () => {
    // 카카오 로그인 성공 시 리다이렉트
    router.push(redirect)
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    router.push(redirect)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-autumn-cream flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-autumn-coral rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로딩 중...</h2>
          <p className="text-gray-600">로그인 상태를 확인하고 있습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-autumn-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo size="xl" showText={false} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">PrayGround</h1>
              <p className="text-gray-600">교회 청년부를 위한 올인원 플랫폼</p>
            </div>

            <div className="space-y-4">
              {/* 카카오 로그인 */}
              <KakaoLoginButton
                onSuccess={handleKakaoSuccess}
                onError={(error) => {
                  console.error('카카오 로그인 오류:', error)
                }}
              />

              {/* 구분선 */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">또는</span>
                </div>
              </div>

              {/* 이메일 로그인 */}
              <Button
                onClick={() => setShowAuthModal(true)}
                variant="outline"
                className="w-full border-autumn-coral text-autumn-coral hover:bg-autumn-coral hover:text-white"
              >
                이메일로 로그인
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                로그인하면 게시판, 캘린더 등 모든 기능을 이용할 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 인증 모달 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signin"
      />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <LoadingSpinner 
        message="로딩 중..."
        subMessage="페이지를 불러오고 있습니다."
        className="bg-autumn-cream"
      />
    }>
      <LoginContent />
    </Suspense>
  )
}