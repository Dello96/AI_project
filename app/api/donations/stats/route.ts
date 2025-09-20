import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 승인된 결제(기부) 통계 조회
    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, customer_name, created_at')
      .eq('status', 'DONE')
      .eq('order_name', '선교사님 후원')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('기부 통계 조회 오류:', error)
      // 오류가 발생해도 빈 데이터로 응답
      return NextResponse.json({
        success: true,
        totalAmount: 0,
        totalCount: 0,
        recentDonations: []
      })
    }

    // 통계 계산
    const totalAmount = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0
    const totalCount = payments?.length || 0

    // 최근 기부 내역 (최대 10건)
    const recentDonations = (payments || []).map(payment => ({
      amount: payment.amount || 0,
      donorName: payment.customer_name || '익명',
      createdAt: payment.created_at
    }))

    return NextResponse.json({
      success: true,
      totalAmount,
      totalCount,
      recentDonations
    })

  } catch (error) {
    console.error('기부 통계 조회 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
