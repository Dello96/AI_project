'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CreditCardIcon, BanknotesIcon } from '@heroicons/react/24/outline'

export default function PaymentTest() {
  const router = useRouter()
  const [amount, setAmount] = useState('1000')
  const [orderName, setOrderName] = useState('테스트 결제')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [showMaxAmountAlert, setShowMaxAmountAlert] = useState(false)
  const MAX_PAYMENT_AMOUNT = 1000000 // 최대 100만원

  // 금액 입력 핸들러 - 실시간 검증
  const handleAmountChange = (value: string) => {
    // 빈 문자열이나 숫자가 아닌 경우 처리
    if (value === '' || value === '0') {
      setAmount(value)
      setShowMaxAmountAlert(false)
      return
    }
    
    const numericValue = parseInt(value) || 0
    
    if (numericValue > MAX_PAYMENT_AMOUNT) {
      // 최대 금액 초과 시 알림 표시하고 최대 금액으로 제한
      setShowMaxAmountAlert(true)
      setAmount(MAX_PAYMENT_AMOUNT.toString())
      
      // 3초 후 알림 숨기기
      setTimeout(() => {
        setShowMaxAmountAlert(false)
      }, 3000)
    } else {
      setAmount(value)
      setShowMaxAmountAlert(false)
    }
  }

  // 키보드 이벤트 핸들러 - 화살표 키, 숫자 패드 등 제한
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentValue = parseInt(amount) || 0
    
    // 위쪽 화살표 키 (증가)
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newValue = currentValue + 1000 // 1000원씩 증가
      if (newValue <= MAX_PAYMENT_AMOUNT) {
        setAmount(newValue.toString())
        setShowMaxAmountAlert(false)
      } else {
        setShowMaxAmountAlert(true)
        setAmount(MAX_PAYMENT_AMOUNT.toString())
        setTimeout(() => setShowMaxAmountAlert(false), 3000)
      }
    }
    
    // 아래쪽 화살표 키 (감소)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newValue = Math.max(100, currentValue - 1000) // 최소 100원
      setAmount(newValue.toString())
      setShowMaxAmountAlert(false)
    }
  }

  const handleTestPayment = () => {
    const paymentAmount = parseInt(amount)
    
    // 최대 금액 검증
    if (paymentAmount > MAX_PAYMENT_AMOUNT) {
      alert(`최대 결제 금액은 ${MAX_PAYMENT_AMOUNT.toLocaleString()}원입니다.`)
      return
    }
    
    const params = new URLSearchParams({
      amount,
      orderName,
      items: JSON.stringify([
        {
          id: '1',
          name: orderName,
          price: paymentAmount,
          quantity: 1,
          description: '테스트용 결제 상품'
        }
      ])
    })

    if (customerName) params.set('customerName', customerName)
    if (customerEmail) params.set('customerEmail', customerEmail)

    router.push(`/payment?${params.toString()}`)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCardIcon className="w-5 h-5 mr-2" />
          결제 테스트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            결제 금액 (원)
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="1000"
            min="100"
            max={MAX_PAYMENT_AMOUNT}
          />
          
          {/* 최대 금액 초과 알림 */}
          {showMaxAmountAlert && (
            <div className="mt-2 p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg">
              <p className="text-orange-400 text-sm font-medium">
                ⚠️ 최대 결제 금액은 {MAX_PAYMENT_AMOUNT.toLocaleString()}원입니다.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            고객명 (선택)
          </label>
          <Input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="홍길동"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이메일 (선택)
          </label>
          <Input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="test@example.com"
          />
        </div>

        <Button
          onClick={handleTestPayment}
          className="w-full"
          disabled={!amount || !orderName || parseInt(amount) > MAX_PAYMENT_AMOUNT}
        >
          <BanknotesIcon className="w-4 h-4 mr-2" />
          {parseInt(amount || '0').toLocaleString()}원 결제 테스트
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <p>• 테스트 모드에서는 실제 결제가 발생하지 않습니다</p>
          <p>• 최소 결제 금액: 100원</p>
          <p>• 최대 결제 금액: {MAX_PAYMENT_AMOUNT.toLocaleString()}원</p>
        </div>
      </CardContent>
    </Card>
  )
}
