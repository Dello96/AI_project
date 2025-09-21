'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { XCircleIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

function PaymentFailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || '알 수 없는 오류가 발생했습니다.'
  const code = searchParams.get('code')
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h1>
          <p className="text-gray-600 mb-6">
            결제 처리 중 오류가 발생했습니다.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm font-medium mb-2">오류 메시지:</p>
            <p className="text-red-700 text-sm">{error}</p>
            {code && (
              <div className="mt-2">
                <p className="text-red-700 text-xs">오류 코드: {code}</p>
              </div>
            )}
            {orderId && (
              <div className="mt-2">
                <p className="text-red-700 text-xs">주문 ID: {orderId}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.back()}
              className="w-full"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              다시 시도하기
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">페이지를 로딩하는 중...</p>
        </div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  )
}
