import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTossPaymentsClient } from '@/lib/toss-payments'

// 결제 검증 요청 스키마
const VerifyPaymentSchema = z.object({
  paymentKey: z.string().min(1, '결제 키는 필수입니다.'),
  orderId: z.string().min(1, '주문 ID는 필수입니다.'),
  amount: z.number().min(1, '결제 금액은 1원 이상이어야 합니다.')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = VerifyPaymentSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false,
          error: '입력 데이터가 올바르지 않습니다.',
          details: parsed.error.issues 
        },
        { status: 400 }
      )
    }

    const { paymentKey, orderId, amount } = parsed.data

    // 토스페이먼츠 클라이언트
    const tossClient = getTossPaymentsClient()

    // 결제 검증
    const isValid = await tossClient.verifyPayment(paymentKey, orderId, amount)

    if (!isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: '결제 검증에 실패했습니다.',
          isValid: false
        },
        { status: 400 }
      )
    }

    // 결제 정보 조회
    const payment = await tossClient.getPayment(paymentKey)

    return NextResponse.json({
      success: true,
      message: '결제 검증이 완료되었습니다.',
      isValid: true,
      payment
    })

  } catch (error) {
    console.error('결제 검증 API 오류:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '결제 검증 중 오류가 발생했습니다.',
        isValid: false
      },
      { status: 500 }
    )
  }
}
