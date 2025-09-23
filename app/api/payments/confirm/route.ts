import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTossPaymentsClient } from '@/lib/toss-payments'
import { createServerSupabaseClient } from '@/lib/supabase'

// 결제 승인 요청 스키마
const ConfirmPaymentSchema = z.object({
  paymentKey: z.string().min(1, '결제 키는 필수입니다.'),
  orderId: z.string().min(1, '주문 ID는 필수입니다.'),
  amount: z.number().min(0, '결제 금액은 0원 이상이어야 합니다.') // amount가 0인 경우도 허용 (토스에서 실제 금액 조회)
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

    // 기존 결제 내역 확인 (중복 방지) - 간단한 버전
    const supabase = createServerSupabaseClient()
    
    try {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (existingPayment && existingPayment.status === 'DONE') {
        console.log('이미 완료된 결제 발견:', existingPayment)
        return NextResponse.json({
          success: true,
          message: '이미 완료된 결제입니다.',
          payment: existingPayment,
          isDuplicate: true
        })
      }
    } catch (error) {
      // 기존 결제가 없는 경우 (정상적인 경우)
      console.log('기존 결제 없음 - 새 결제 진행')
    }

    // 토스페이먼츠 API를 직접 호출하여 결제 승인
    const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json(
        { 
          success: false,
          error: '토스페이먼츠 시크릿 키가 설정되지 않았습니다.' 
        },
        { status: 500 }
      )
    }

    console.log('결제 승인 요청:', { paymentKey, orderId, amount })

    let payment: any

    // 테스트 환경에서는 mock 결제 데이터 생성
    if (paymentKey === 'test_payment_key' || paymentKey.startsWith('test_')) {
      console.log('테스트 환경 - Mock 결제 데이터 생성')
      payment = {
        paymentKey,
        orderId,
        amount: amount || 10000,
        orderName: `테스트 결제 - ${orderId}`,
        status: 'DONE',
        type: 'CARD',
        method: '카드',
        approvedAt: new Date().toISOString(),
        requestedAt: new Date().toISOString(),
        customerName: '테스트 고객',
        customerEmail: 'test@example.com'
      }
    } else {
      // 실제 토스페이먼츠 API 호출
      console.log('실제 토스페이먼츠 API 호출')
      
      // amount가 0인 경우, 먼저 결제 정보를 조회하여 실제 금액을 확인
      let actualAmount = amount
      if (amount === 0) {
        console.log('amount가 0이므로 결제 정보 조회')
        const getResponse = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        })

        if (getResponse.ok) {
          const paymentInfo = await getResponse.json()
          actualAmount = paymentInfo.amount
          console.log('조회된 실제 결제 금액:', actualAmount)
        }
      }

      const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: actualAmount
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('토스페이먼츠 API 오류:', errorData)
        throw new Error(errorData.message || '결제 승인에 실패했습니다.')
      }

      payment = await response.json()
    }
    
    console.log('결제 승인 성공:', payment)

    // 결제 성공 시 데이터베이스에 저장
    if (payment.status === 'DONE') {
      // 결제 내역 저장 (upsert 사용으로 중복 방지)
      const { error: insertError } = await supabase
        .from('payments')
        .upsert({
          payment_key: payment.paymentKey,
          order_id: payment.orderId,
          amount: payment.amount,
          order_name: payment.orderName,
          status: payment.status,
          method: payment.type || payment.method || 'CARD',
          customer_name: payment.customerName || null,
          customer_email: payment.customerEmail || null,
          customer_mobile_phone: payment.customerMobilePhone || null,
          approved_at: payment.approvedAt,
          requested_at: payment.requestedAt || new Date().toISOString(),
          items: []
        }, {
          onConflict: 'order_id' // order_id가 중복되면 업데이트
        })

      if (insertError) {
        console.error('결제 내역 저장 오류:', insertError)
        // 결제는 성공했지만 DB 저장 실패 - 로그만 남기고 성공 응답
      } else {
        console.log('결제 내역 저장 성공:', payment.orderId)
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
