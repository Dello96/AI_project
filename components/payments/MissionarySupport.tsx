'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { HeartIcon, BanknotesIcon, GiftIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface DonationStats {
  totalAmount: number
  totalCount: number
  recentDonations: Array<{
    amount: number
    donorName: string
    createdAt: string
  }>
}

export default function MissionarySupport() {
  const router = useRouter()
  const [amount, setAmount] = useState('10000')
  const MAX_DONATION_AMOUNT = 1000000 // 최대 100만원
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [showMaxAmountAlert, setShowMaxAmountAlert] = useState(false)
  const [donationStats, setDonationStats] = useState<DonationStats>({
    totalAmount: 0,
    totalCount: 0,
    recentDonations: []
  })
  const [isLoading, setIsLoading] = useState(true)

  // 기부 통계 조회
  const fetchDonationStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/donations/stats')
      if (response.ok) {
        const data = await response.json()
        setDonationStats(data)
      }
    } catch (error) {
      console.error('기부 통계 조회 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDonationStats()
  }, [])

  // 금액 입력 핸들러 - 실시간 검증
  const handleAmountChange = (value: string) => {
    // 빈 문자열이나 숫자가 아닌 경우 처리
    if (value === '' || value === '0') {
      setAmount(value)
      setShowMaxAmountAlert(false)
      return
    }
    
    const numericValue = parseInt(value) || 0
    
    if (numericValue > MAX_DONATION_AMOUNT) {
      // 최대 금액 초과 시 알림 표시하고 최대 금액으로 제한
      setShowMaxAmountAlert(true)
      setAmount(MAX_DONATION_AMOUNT.toString())
      
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
      if (newValue <= MAX_DONATION_AMOUNT) {
        setAmount(newValue.toString())
        setShowMaxAmountAlert(false)
      } else {
        setShowMaxAmountAlert(true)
        setAmount(MAX_DONATION_AMOUNT.toString())
        setTimeout(() => setShowMaxAmountAlert(false), 3000)
      }
    }
    
    // 아래쪽 화살표 키 (감소)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newValue = Math.max(1000, currentValue - 1000) // 최소 1000원
      setAmount(newValue.toString())
      setShowMaxAmountAlert(false)
    }
  }

  const handleDonation = () => {
    const donationAmount = parseInt(amount)
    
    // 최대 금액 검증
    if (donationAmount > MAX_DONATION_AMOUNT) {
      alert(`최대 후원 금액은 ${MAX_DONATION_AMOUNT.toLocaleString()}원입니다.`)
      return
    }
    
    const params = new URLSearchParams({
      amount,
      orderName: '선교사님 후원',
      items: JSON.stringify([
        {
          id: 'missionary-support',
          name: '선교사님 후원',
          price: donationAmount,
          quantity: 1,
          description: '선교사님을 위한 후원금'
        }
      ])
    })

    if (donorName) params.set('customerName', donorName)
    if (donorEmail) params.set('customerEmail', donorEmail)

    // 고유한 주문 ID 생성 (중복 방지)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    const orderId = `MISSIONARY_${timestamp}_${random}`
    const successUrl = `${window.location.origin}/payment/success`
    const failUrl = `${window.location.origin}/payment/fail`

    const paymentParams = new URLSearchParams({
      amount: amount,
      orderId,
      orderName: '선교사님 후원',
      customerName: donorName || '',
      customerEmail: donorEmail || '',
      successUrl,
      failUrl
    })

    window.location.href = `/api/payments/redirect?${paymentParams.toString()}`
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ko-KR')
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 기부 통계 카드 - 다크 테마 */}
      <Card className="bg-gradient-to-r from-gray-800 to-gray-700 border-orange-500/30 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-400">
            <HeartIcon className="w-6 h-6 mr-2" />
            기부 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner 
              message="기부 현황을 불러오는 중..."
              size="sm"
              className="py-8"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  {formatAmount(donationStats.totalAmount)}원
                </div>
                <p className="text-sm text-gray-400">총 기부금액</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400 mb-2">
                  {donationStats.totalCount}건
                </div>
                <p className="text-sm text-gray-400">총 기부건수</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {donationStats.totalCount > 0 ? Math.round(donationStats.totalAmount / donationStats.totalCount).toLocaleString() : 0}원
                </div>
                <p className="text-sm text-gray-400">평균 기부금액</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 최근 기부 내역 - 다크 테마 */}
      {donationStats.recentDonations.length > 0 && (
        <Card className="bg-gradient-to-r from-gray-800 to-gray-700 border-orange-500/30">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-400">
              <GiftIcon className="w-5 h-5 mr-2" />
              최근 기부 내역
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {donationStats.recentDonations.slice(0, 5).map((donation, index) => (
                <div key={index} className="flex justify-between items-center py-3 px-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
                  <div>
                    <span className="font-medium text-white">
                      {donation.donorName || '익명'}
                    </span>
                    <span className="text-sm text-gray-400 ml-2">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-semibold text-orange-400">
                    {formatAmount(donation.amount)}원
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기부 폼 - 다크 테마 */}
      <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-gray-800 to-gray-900 border-orange-500/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center text-center justify-center text-orange-400">
            <HeartIcon className="w-6 h-6 mr-2 text-red-500" />
            선교사님 후원
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              후원 금액 (원)
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="10000"
              min="1000"
              max={MAX_DONATION_AMOUNT}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
            />
            
            {/* 최대 금액 초과 알림 */}
            {showMaxAmountAlert && (
              <div className="mt-2 p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg">
                <p className="text-orange-400 text-sm font-medium">
                  ⚠️ 최대 후원 금액은 {MAX_DONATION_AMOUNT.toLocaleString()}원입니다.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              후원자명 (선택)
            </label>
            <Input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="홍길동"
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              이메일 (선택)
            </label>
            <Input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="donor@example.com"
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
            />
          </div>

          <Button
            onClick={handleDonation}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            disabled={!amount || parseInt(amount) < 1000 || parseInt(amount) > MAX_DONATION_AMOUNT}
          >
            <BanknotesIcon className="w-4 h-4 mr-2" />
            {parseInt(amount || '0').toLocaleString()}원 후원하기
          </Button>

          <div className="text-xs text-gray-400 text-center space-y-1">
            <p>• 후원금은 선교사님의 사역에 사용됩니다</p>
            <p>• 최소 후원 금액: 1,000원</p>
            <p>• 최대 후원 금액: {MAX_DONATION_AMOUNT.toLocaleString()}원</p>
            <p>• 후원 내역은 익명으로 처리됩니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
