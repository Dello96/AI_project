'use client'

import { useEffect, useState } from 'react'
import { loadTossPayments } from '@tosspayments/payment-sdk'
import { PaymentRequest, PaymentError } from '@/types/payment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

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
  const [widget, setWidget] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 토스페이먼츠 위젯 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initializeWidget = async () => {
      try {
        const tossPayments = await loadTossPayments(clientKey)
        
        // PaymentWidget 인스턴스 생성
        const paymentWidget = tossPayments.PaymentWidget({
          customerKey: 'customer_' + Date.now(), // 고유한 고객 키
          brandColor: '#3b82f6' // 브랜드 컬러
        })
        
        setWidget(paymentWidget)
      } catch (err) {
        console.error('토스페이먼츠 위젯 초기화 오류:', err)
        setError('결제 시스템을 초기화하는데 실패했습니다.')
      }
    }

    initializeWidget()
  }, [clientKey])


  // 위젯 렌더링 및 이벤트 리스너 등록
  useEffect(() => {
    if (!widget) return

    const renderWidget = async () => {
      try {
        await widget.render('#payment-widget')
      } catch (err) {
        console.error('위젯 렌더링 오류:', err)
        setError('결제 위젯을 불러오는데 실패했습니다.')
      }
    }

    const handleSuccess = (payment: any) => {
      console.log('결제 성공:', payment)
      onSuccess?.(payment)
    }

    const handleFail = (error: PaymentError) => {
      console.error('결제 실패:', error)
      setError(error.message)
      onFail?.(error)
    }

    const handleCancel = (error: PaymentError) => {
      console.log('결제 취소:', error)
      onCancel?.(error)
    }

    // 위젯 렌더링
    renderWidget()

    // 이벤트 리스너 등록
    widget.on('success', handleSuccess)
    widget.on('fail', handleFail)
    widget.on('cancel', handleCancel)

    return () => {
      widget.off('success', handleSuccess)
      widget.off('fail', handleFail)
      widget.off('cancel', handleCancel)
    }
  }, [widget, onSuccess, onFail, onCancel])

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
        {/* 결제 위젯 영역 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">결제 수단을 선택하세요</h3>
          <div id="payment-widget" className="min-h-[400px] border border-gray-200 rounded-lg p-4">
            {!widget && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">결제 위젯을 불러오는 중...</p>
                </div>
              </div>
            )}
          </div>
        </div>

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
