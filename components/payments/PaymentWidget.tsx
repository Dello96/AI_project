'use client'

import { useState } from 'react'
import { PaymentRequest, PaymentError } from '@/types/payment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface PaymentWidgetProps {
  clientKey: string
  paymentRequest: PaymentRequest
  onSuccess?: (payment: any) => void
  onFail?: (error: PaymentError) => void
  onCancel?: (error: PaymentError) => void
  className?: string
}

function PaymentWidget({ 
  clientKey, 
  paymentRequest, 
  onSuccess, 
  onFail, 
  onCancel,
  className = ''
}: PaymentWidgetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 매번 새로운 고유한 주문 ID 생성 (중복 방지)
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const uniqueOrderId = `${paymentRequest.orderId}_${timestamp}_${random}`

      // 토스페이먼츠 결제 페이지로 리다이렉트
      const params = new URLSearchParams({
        amount: paymentRequest.amount.toString(),
        orderId: uniqueOrderId, // 고유한 주문 ID 사용
        orderName: paymentRequest.orderName,
        customerName: paymentRequest.customerName || '',
        customerEmail: paymentRequest.customerEmail || '',
        successUrl: paymentRequest.successUrl,
        failUrl: paymentRequest.failUrl
      })

      window.location.href = `/api/payments/redirect?${params.toString()}`
    } catch (err) {
      console.error('결제 오류:', err)
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.')
      onFail?.({
        code: 'PAYMENT_ERROR',
        message: '결제 처리 중 오류가 발생했습니다.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-gray-900">
          결제하기
        </CardTitle>
        <div className="text-center text-gray-600">
          <p className="text-lg font-semibold">{paymentRequest.orderName}</p>
          <p className="text-2xl font-bold text-primary-600">
            {paymentRequest.amount.toLocaleString()}원
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 결제 상품 목록 */}
        <div>
          <h3 className="text-lg font-semibold mb-3">결제 상품</h3>
          <div className="space-y-2">
            {paymentRequest.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-sm text-gray-500">{item.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {item.price.toLocaleString()}원 × {item.quantity}개
                  </p>
                  <p className="text-sm text-gray-500">
                    = {(item.price * item.quantity).toLocaleString()}원
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 결제 버튼 */}
        <div className="pt-4">
          <Button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full h-12 text-lg font-semibold"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                결제 처리 중...
              </div>
            ) : (
              `${paymentRequest.amount.toLocaleString()}원 결제하기`
            )}
          </Button>
        </div>

        {/* 안내 메시지 */}
        <div className="text-center text-sm text-gray-500">
          <p>결제는 토스페이먼츠를 통해 안전하게 처리됩니다.</p>
          <p>결제 완료 후 자동으로 페이지가 이동됩니다.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export { PaymentWidget }
export default PaymentWidget
