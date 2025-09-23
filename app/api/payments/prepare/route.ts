import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase'
import { paymentManager, validatePaymentAmount, validateOrderId } from '@/lib/payment-utils'

// 결제 준비 요청 스키마
const PreparePaymentSchema = z.object({
  orderId: z.string().min(1, '주문 ID는 필수입니다.'),
  amount: z.number().min(1, '결제 금액은 1원 이상이어야 합니다.'),
  orderName: z.string().min(1, '주문명은 필수입니다.'),
  customerName: z.string().optional(),
  customerEmail: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = PreparePaymentSchema.safeParse(body)
    
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

    const { orderId, amount, orderName, customerName, customerEmail } = parsed.data

    // 주문 ID 검증
    const orderIdValidation = validateOrderId(orderId)
    if (!orderIdValidation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: orderIdValidation.error 
        },
        { status: 400 }
      )
    }

    // 결제 금액 검증
    const amountValidation = validatePaymentAmount(amount)
    if (!amountValidation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: amountValidation.error 
        },
        { status: 400 }
      )
    }

    // 중복 결제 확인
    const duplicateCheck = await paymentManager.isDuplicatePayment(orderId)
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json({
        success: false,
        error: duplicateCheck.reason || '중복된 결제입니다.',
        isDuplicate: true
      }, { status: 409 })
    }

    const supabase = createServerSupabaseClient()

    // 결제 준비 상태로 DB에 저장
    const { error: insertError } = await supabase
      .from('payments')
      .upsert({
        order_id: orderId,
        amount,
        order_name: orderName,
        status: 'READY',
        customer_name: customerName || null,
        customer_email: customerEmail || null,
        requested_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('결제 준비 저장 오류:', insertError)
      return NextResponse.json(
        { 
          success: false,
          error: '결제 준비 중 오류가 발생했습니다.' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '결제 준비가 완료되었습니다.',
      orderId
    })

  } catch (error) {
    console.error('결제 준비 API 오류:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '서버 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}
