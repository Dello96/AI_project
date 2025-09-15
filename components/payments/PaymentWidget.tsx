'use client'

import { useEffect, useRef, useState } from 'react'
import { loadTossPayments } from '@tosspayments/payment-sdk'
import { PaymentRequest, PaymentWidgetEvents, PaymentError } from '@/types/payment'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  DevicePhoneMobileIcon,
  GiftIcon 
} from '@heroicons/react/24/outline'

interface PaymentWidgetProps {
  clientKey: string
  paymentRequest: PaymentRequest
  onSuccess?: (payment: any) => void
  onFail?: (error: PaymentError) => void
  onCancel?: (error: PaymentError) => void
  className?: string
}

const paymentMethods = [
  { 
    method: '카드', 
    icon: CreditCardIcon, 
    description: '신용카드, 체크카드',
    color: 'bg-blue-500'
  },
  { 
    method: '계좌이체', 
    icon: BanknotesIcon, 
    description: '실시간 계좌이체',
    color: 'bg-green-500'
  },
  { 
    method: '가상계좌', 
    icon: BanknotesIcon, 
    description: '가상계좌 입금',
    color: 'bg-purple-500'
  },
  { 
    method: '휴대폰', 
    icon: DevicePhoneMobileIcon, 
    description: '휴대폰 소액결제',
    color: 'bg-orange-500'
  },
  { 
    method: '상품권', 
    icon: GiftIcon, 
    description: '문화상품권, 도서상품권',
    color: 'bg-pink-500'
  }
]

function PaymentWidget({ 
  clientKey, 
  paymentRequest, 
  onSuccess, 
  onFail, 
  onCancel,
  className = ''
}: PaymentWidgetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string>('카드')
  const [widget, setWidget] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)

  // 토스페이먼츠 위젯 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initializeWidget = async () => {
      try {
        const tossPayments = await loadTossPayments(clientKey)
        setWidget(tossPayments)
      } catch (err) {
        console.error('토스페이먼츠 위젯 초기화 오류:', err)
        setError('결제 시스템을 초기화하는데 실패했습니다.')
      }
    }

    initializeWidget()
  }, [clientKey])

  // 결제 요청
  const handlePayment = async () => {
    if (!widget) {
      setError('결제 시스템이 준비되지 않았습니다.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await widget.requestPayment(selectedMethod, {
        amount: paymentRequest.amount,
        orderId: paymentRequest.orderId,
        orderName: paymentRequest.orderName,
        customerName: paymentRequest.customerName,
        customerEmail: paymentRequest.customerEmail,
        customerMobilePhone: paymentRequest.customerMobilePhone,
        successUrl: paymentRequest.successUrl,
        failUrl: paymentRequest.failUrl,
        easyPay: selectedMethod === '카드' ? '토스페이' : undefined
      })
    } catch (err) {
      console.error('결제 요청 오류:', err)
      setError('결제 요청 중 오류가 발생했습니다.')
      onFail?.(err as PaymentError)
    } finally {
      setIsLoading(false)
    }
  }

  // 결제 성공 콜백
  useEffect(() => {
    if (!widget) return

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
        {/* 결제 수단 선택 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">결제 수단을 선택하세요</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.method}
                onClick={() => setSelectedMethod(method.method)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedMethod === method.method
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${method.color} flex items-center justify-center`}>
                    <method.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{method.method}</p>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                </div>
              </button>
            ))}
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

        {/* 결제 버튼 */}
        <div className="pt-4">
          <Button
            onClick={handlePayment}
            disabled={isLoading || !widget}
            className="w-full h-14 text-lg font-semibold"
            loading={isLoading}
          >
            {isLoading ? '결제 진행 중...' : `${paymentRequest.amount.toLocaleString()}원 결제하기`}
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
