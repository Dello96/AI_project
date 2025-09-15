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

  const handleTestPayment = () => {
    const params = new URLSearchParams({
      amount,
      orderName,
      items: JSON.stringify([
        {
          id: '1',
          name: orderName,
          price: parseInt(amount),
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
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            min="100"
          />
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
          disabled={!amount || !orderName}
        >
          <BanknotesIcon className="w-4 h-4 mr-2" />
          {parseInt(amount || '0').toLocaleString()}원 결제 테스트
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <p>• 테스트 모드에서는 실제 결제가 발생하지 않습니다</p>
          <p>• 최소 결제 금액: 100원</p>
        </div>
      </CardContent>
    </Card>
  )
}
