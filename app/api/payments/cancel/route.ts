import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTossPaymentsClient } from '@/lib/toss-payments'
import { createServerSupabaseClient } from '@/lib/supabase'

// 결제 취소 요청 스키마
const CancelPaymentSchema = z.object({
  paymentKey: z.string().min(1, '결제 키는 필수입니다.'),
  cancelReason: z.string().min(1, '취소 사유는 필수입니다.'),
  cancelAmount: z.number().optional(),
  taxFreeAmount: z.number().optional(),
  taxExemptionAmount: z.number().optional(),
  refundableAmount: z.number().optional(),
  currency: z.string().default('KRW'),
  refundAccount: z.object({
    bank: z.string(),
    accountNumber: z.string(),
    holderName: z.string()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CancelPaymentSchema.safeParse(body)
    
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

    const { paymentKey, cancelReason, ...cancelOptions } = parsed.data

    // 토스페이먼츠 클라이언트
    const tossClient = getTossPaymentsClient()

    // 결제 취소
    const cancelRequest: any = {
      paymentKey,
      cancelReason
    }
    
    if (cancelOptions.cancelAmount !== undefined) {
      cancelRequest.cancelAmount = cancelOptions.cancelAmount
    }
    if (cancelOptions.taxFreeAmount !== undefined) {
      cancelRequest.taxFreeAmount = cancelOptions.taxFreeAmount
    }
    if (cancelOptions.taxExemptionAmount !== undefined) {
      cancelRequest.taxExemptionAmount = cancelOptions.taxExemptionAmount
    }
    if (cancelOptions.refundableAmount !== undefined) {
      cancelRequest.refundableAmount = cancelOptions.refundableAmount
    }
    if (cancelOptions.currency !== undefined) {
      cancelRequest.currency = cancelOptions.currency
    }
    if (cancelOptions.refundAccount !== undefined) {
      cancelRequest.refundAccount = cancelOptions.refundAccount
    }
    
    const payment = await tossClient.cancelPayment(cancelRequest)

    // 취소 성공 시 데이터베이스 업데이트
    if (payment.status === 'CANCELED' || payment.status === 'PARTIAL_CANCELED') {
      const supabase = createServerSupabaseClient()
      
      // 결제 상태 업데이트
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: payment.status,
          canceled_at: new Date().toISOString()
        })
        .eq('payment_key', paymentKey)

      if (updateError) {
        console.error('결제 취소 상태 업데이트 오류:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      message: '결제가 성공적으로 취소되었습니다.',
      payment
    })

  } catch (error) {
    console.error('결제 취소 API 오류:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '결제 취소 중 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}
