'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function TestPaymentPage() {
  const [amount, setAmount] = useState('10000')
  const [orderName, setOrderName] = useState('테스트 결제')
  const [customerName, setCustomerName] = useState('홍길동')
  const [customerEmail, setCustomerEmail] = useState('test@example.com')
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setIsLoading(true)
      
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const orderId = `TEST_${timestamp}_${random}`
      const successUrl = `${window.location.origin}/payment/success`
      const failUrl = `${window.location.origin}/payment/fail`

      // 결제 요청 파라미터
      const params = new URLSearchParams({
        amount,
        orderId,
        orderName,
        customerName,
        customerEmail,
        successUrl,
        failUrl
      })

      // 결제창으로 리다이렉트
      window.location.href = `/api/payments/redirect?${params.toString()}`
    } catch (error) {
      console.error('결제 요청 오류:', error)
      alert('결제 요청 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              토스페이먼츠 테스트 결제
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                결제 금액 (원)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주문명
              </label>
              <Input
                type="text"
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                placeholder="테스트 결제"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                고객명
              </label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                고객 이메일
              </label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>

            <Button
              onClick={handlePayment}
              disabled={isLoading || !amount || !orderName}
              className="w-full h-12 text-lg font-semibold"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  결제 요청 중...
                </div>
              ) : (
                `${parseInt(amount).toLocaleString()}원 결제하기`
              )}
            </Button>

            <div className="text-center text-sm text-gray-500 space-y-2">
              <p>🧪 <strong>테스트 환경</strong></p>
              <p>실제 결제가 이루어지지 않습니다.</p>
              <p>토스페이먼츠 테스트 카드로 결제를 진행하세요.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">테스트 카드 정보</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>카드번호:</strong> 4000000000000004</p>
                <p><strong>유효기간:</strong> 12/25</p>
                <p><strong>CVC:</strong> 123</p>
                <p><strong>카드 비밀번호:</strong> 1234</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
