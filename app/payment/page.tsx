'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PaymentWidget } from '@/components/payments/PaymentWidget'
import { PaymentRequest, PaymentResponse, PaymentError } from '@/types/payment'
import { generateOrderId, validatePaymentRequest } from '@/lib/toss-payments'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null)

  // 클라이언트 키 (환경 변수에서 가져오기)
  const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY || ''

  useEffect(() => {
    // URL 파라미터에서 결제 정보 가져오기
    const amount = searchParams.get('amount')
    const orderName = searchParams.get('orderName')
    const items = searchParams.get('items')

    if (!amount || !orderName) {
      setError('결제 정보가 올바르지 않습니다.')
      setIsLoading(false)
      return
    }

    try {
      // 결제 요청 데이터 생성
      const request: any = {
        orderId: generateOrderId('PAYMENT'),
        amount: parseInt(amount),
        orderName: decodeURIComponent(orderName),
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        items: items ? JSON.parse(decodeURIComponent(items)) : [
          {
            id: '1',
            name: orderName,
            price: parseInt(amount),
            quantity: 1
          }
        ]
      }
      
      const customerName = searchParams.get('customerName')
      const customerEmail = searchParams.get('customerEmail')
      const customerMobilePhone = searchParams.get('customerMobilePhone')
      
      if (customerName) request.customerName = customerName
      if (customerEmail) request.customerEmail = customerEmail
      if (customerMobilePhone) request.customerMobilePhone = customerMobilePhone

      // 결제 요청 데이터 검증
      const validation = validatePaymentRequest(request)
      if (!validation.isValid) {
        setError(validation.errors.join(', '))
        setIsLoading(false)
        return
      }

      setPaymentRequest(request)
    } catch (err) {
      console.error('결제 정보 파싱 오류:', err)
      setError('결제 정보를 처리하는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  // 결제 성공 처리
  const handlePaymentSuccess = async (payment: PaymentResponse) => {
    try {
      setPaymentResult(payment)
      
      // 결제 승인 API 호출
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey: payment.paymentKey,
          orderId: payment.orderId,
          amount: payment.amount
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '결제 승인에 실패했습니다.')
      }

      // 성공 페이지로 이동
      router.push(`/payment/success?paymentKey=${payment.paymentKey}&orderId=${payment.orderId}`)
    } catch (err) {
      console.error('결제 승인 오류:', err)
      setError(err instanceof Error ? err.message : '결제 승인에 실패했습니다.')
    }
  }

  // 결제 실패 처리
  const handlePaymentFail = (error: PaymentError) => {
    console.error('결제 실패:', error)
    router.push(`/payment/fail?error=${encodeURIComponent(error.message)}`)
  }

  // 결제 취소 처리
  const handlePaymentCancel = (error: PaymentError) => {
    console.log('결제 취소:', error)
    router.push(`/payment/cancel?error=${encodeURIComponent(error.message)}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">결제 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">결제 오류</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.back()} className="w-full">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              이전 페이지로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!paymentRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">결제 정보 없음</h2>
            <p className="text-gray-600 mb-6">결제할 상품 정보를 찾을 수 없습니다.</p>
            <Button onClick={() => router.push('/')} className="w-full">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            이전 페이지로
          </Button>
        </div>

        <PaymentWidget
          clientKey={clientKey}
          paymentRequest={paymentRequest}
          onSuccess={handlePaymentSuccess}
          onFail={handlePaymentFail}
          onCancel={handlePaymentCancel}
        />
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">페이지를 로딩하는 중...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
