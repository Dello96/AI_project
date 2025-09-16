'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PaymentResponse } from '@/types/payment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircleIcon, ReceiptPercentIcon, HomeIcon } from '@heroicons/react/24/outline'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')

    if (!paymentKey || !orderId) {
      setError('결제 정보를 찾을 수 없습니다.')
      setIsLoading(false)
      return
    }

    // 결제 정보 조회
    fetchPaymentInfo(paymentKey, orderId)
  }, [searchParams])

  const fetchPaymentInfo = async (paymentKey: string, orderId: string) => {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: 0 // 검증용이므로 0으로 설정
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '결제 정보 조회에 실패했습니다.')
      }

      setPayment(result.payment)
    } catch (err) {
      console.error('결제 정보 조회 오류:', err)
      setError(err instanceof Error ? err.message : '결제 정보를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">결제 정보를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">오류 발생</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/')} className="w-full">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-4">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 성공 메시지 */}
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">결제 완료!</h1>
            <p className="text-gray-600 text-lg">
              결제가 성공적으로 완료되었습니다.
            </p>
          </CardContent>
        </Card>

        {/* 결제 정보 */}
        {payment && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ReceiptPercentIcon className="w-5 h-5 mr-2" />
                결제 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">주문명</p>
                  <p className="font-medium">{payment.orderName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">결제 금액</p>
                  <p className="font-medium text-lg text-primary-600">
                    {payment.amount.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">주문 번호</p>
                  <p className="font-medium font-mono text-sm">{payment.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">결제 키</p>
                  <p className="font-medium font-mono text-sm">{payment.paymentKey}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">결제 수단</p>
                  <p className="font-medium">{payment.method || '알 수 없음'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">결제 상태</p>
                  <p className="font-medium text-green-600">
                    {payment.status === 'DONE' ? '완료' : payment.status}
                  </p>
                </div>
                {payment.approvedAt && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">결제 완료 시간</p>
                    <p className="font-medium">{formatDate(payment.approvedAt)}</p>
                  </div>
                )}
              </div>

              {/* 영수증 링크 */}
              {payment.receipt?.url && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => payment.receipt && window.open(payment.receipt.url, '_blank')}
                    className="w-full"
                  >
                    영수증 보기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => router.push('/')}
            className="flex-1"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            홈으로 돌아가기
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/board')}
            className="flex-1"
          >
            게시판으로 가기
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">페이지를 로딩하는 중...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
