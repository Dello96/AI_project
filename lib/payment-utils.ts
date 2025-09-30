import { createServerSupabaseClient } from '@/lib/supabase'

// 결제 상태 관리 유틸리티
export class PaymentManager {
  private supabase = createServerSupabaseClient()

  // 결제 상태 확인
  async checkPaymentStatus(orderId: string) {
    const { data: payment } = await this.supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    return payment
  }

  // 결제 상태 업데이트
  async updatePaymentStatus(orderId: string, status: string, additionalData?: any) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (additionalData) {
      Object.assign(updateData, additionalData)
    }

    const { error } = await this.supabase
      .from('payments')
      .update(updateData)
      .eq('order_id', orderId)

    if (error) {
      console.error('결제 상태 업데이트 오류:', error)
      throw error
    }

    return true
  }

  // 만료된 결제 정리 (30분 이상 된 READY 상태)
  async cleanupExpiredPayments() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    const { error } = await this.supabase
      .from('payments')
      .update({ status: 'EXPIRED' })
      .eq('status', 'READY')
      .lt('requested_at', thirtyMinutesAgo)

    if (error) {
      console.error('만료된 결제 정리 오류:', error)
    }
  }

  // 중복 결제 방지 확인
  async isDuplicatePayment(orderId: string): Promise<{ isDuplicate: boolean; reason?: string }> {
    try {
      const payment = await this.checkPaymentStatus(orderId)

      if (!payment) {
        return { isDuplicate: false }
      }

      if (payment.status === 'DONE') {
        return { 
          isDuplicate: true, 
          reason: '이미 완료된 결제입니다.' 
        }
      }

      if (payment.status === 'IN_PROGRESS' || payment.status === 'READY') {
        // 10분 이상 된 경우 만료 처리 (30분 → 10분으로 단축)
        const requestedAt = new Date(payment.requested_at)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

        if (requestedAt < tenMinutesAgo) {
          await this.updatePaymentStatus(orderId, 'EXPIRED')
          return { isDuplicate: false }
        }

        return { 
          isDuplicate: true, 
          reason: '이미 진행 중인 결제가 있습니다. 10분 후 다시 시도해주세요.' 
        }
      }

      return { isDuplicate: false }
    } catch (error) {
      console.error('중복 결제 확인 오류:', error)
      // 에러 발생 시 결제 허용 (안전한 기본값)
      return { isDuplicate: false }
    }
  }
}

// 싱글톤 인스턴스
export const paymentManager = new PaymentManager()

// 고유한 주문 ID 생성
export function generateOrderId(prefix: string = 'ORDER'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${prefix}_${timestamp}_${random}`
}

// 결제 금액 검증
export function validatePaymentAmount(amount: number): { isValid: boolean; error?: string } {
  if (amount <= 0) {
    return { isValid: false, error: '결제 금액은 0원보다 커야 합니다.' }
  }

  if (amount > 10000000) {
    return { isValid: false, error: '결제 금액이 너무 큽니다. (최대 1,000만원)' }
  }

  return { isValid: true }
}

// 주문 ID 검증
export function validateOrderId(orderId: string): { isValid: boolean; error?: string } {
  if (!orderId || orderId.trim() === '') {
    return { isValid: false, error: '주문 ID는 필수입니다.' }
  }

  if (orderId.length > 64) {
    return { isValid: false, error: '주문 ID는 64자 이하여야 합니다.' }
  }

  // 특수문자 검증 (영문, 숫자, 하이픈, 언더스코어만 허용)
  const validPattern = /^[a-zA-Z0-9_-]+$/
  if (!validPattern.test(orderId)) {
    return { isValid: false, error: '주문 ID는 영문, 숫자, 하이픈, 언더스코어만 사용할 수 있습니다.' }
  }

  return { isValid: true }
}
