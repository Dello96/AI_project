import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTossPaymentsClient } from '@/lib/toss-payments'
import { createServerSupabaseClient } from '@/lib/supabase'

// 결제 승인 요청 스키마
const ConfirmPaymentSchema = z.object({
  paymentKey: z.string().min(1, '결제 키는 필수입니다.'),
  orderId: z.string().min(1, '주문 ID는 필수입니다.'),
  amount: z.number().min(1, '결제 금액은 1원 이상이어야 합니다.')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ConfirmPaymentSchema.safeParse(body)
    
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

    // 결제 승인
    const payment = await tossClient.confirmPayment(paymentKey, orderId, amount)

    // 결제 성공 시 데이터베이스에 저장
    if (payment.status === 'DONE') {
      const supabase = createServerSupabaseClient()
      
      // 결제 내역 저장
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          payment_key: payment.paymentKey,
          order_id: payment.orderId,
          amount: payment.amount,
          order_name: payment.orderName,
          status: payment.status,
          method: payment.type || 'CARD',
          customer_name: null,
          customer_email: null,
          customer_mobile_phone: null,
          approved_at: payment.approvedAt,
          requested_at: payment.requestedAt,
          items: []
        })

      if (insertError) {
        console.error('결제 내역 저장 오류:', insertError)
        // 결제는 성공했지만 DB 저장 실패 - 로그만 남기고 성공 응답
      }
    }

    return NextResponse.json({
      success: true,
      message: '결제가 성공적으로 완료되었습니다.',
      payment
    })

  } catch (error) {
    console.error('결제 승인 API 오류:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '결제 승인 중 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}
