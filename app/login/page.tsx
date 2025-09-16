'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/board'
  
  // 로그인 페이지 접근 시 바로 리다이렉트
  useEffect(() => {
    router.push(redirect)
  }, [router, redirect])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">이동 중...</h2>
        <p className="text-gray-600">게시판으로 이동하고 있습니다.</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로딩 중...</h2>
          <p className="text-gray-600">페이지를 로딩하고 있습니다.</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
