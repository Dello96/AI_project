import { loadTossPayments } from '@tosspayments/payment-sdk'
import { PaymentRequest, PaymentResponse, PaymentCancelRequest } from '@/types/payment'

// 토스페이먼츠 클라이언트 설정
export class TossPaymentsClient {
  private secretKey: string
  private baseUrl: string

  constructor() {
    this.secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY || ''
    this.baseUrl = 'https://api.tosspayments.com/v1'
    
    if (!this.secretKey) {
      throw new Error('TOSS_PAYMENTS_SECRET_KEY가 설정되지 않았습니다.')
    }
  }

  // HTTP 요청 헬퍼
  private async makeRequest(endpoint: string, method: string, data?: any): Promise<any> {
    const requestInit: RequestInit = {
      method,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    }

    if (data) {
      requestInit.body = JSON.stringify(data)
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, requestInit)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'API 요청에 실패했습니다.')
    }

    return response.json()
  }

  // 결제 승인
  async confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<PaymentResponse> {
    try {
      const response = await this.makeRequest('/payments/confirm', 'POST', {
        paymentKey,
        orderId,
        amount
      })

      return response as PaymentResponse
    } catch (error) {
      console.error('결제 승인 오류:', error)
      throw new Error('결제 승인에 실패했습니다.')
    }
  }

  // 결제 조회
  async getPayment(paymentKey: string): Promise<PaymentResponse> {
    try {
      const response = await this.makeRequest(`/payments/${paymentKey}`, 'GET')
      return response as PaymentResponse
    } catch (error) {
      console.error('결제 조회 오류:', error)
      throw new Error('결제 조회에 실패했습니다.')
    }
  }

  // 결제 취소
  async cancelPayment(request: PaymentCancelRequest): Promise<PaymentResponse> {
    try {
      const response = await this.makeRequest(`/payments/${request.paymentKey}/cancel`, 'POST', {
        cancelReason: request.cancelReason,
        cancelAmount: request.cancelAmount,
        taxFreeAmount: request.taxFreeAmount,
        taxExemptionAmount: request.taxExemptionAmount,
        refundableAmount: request.refundableAmount,
        currency: request.currency || 'KRW',
        refundAccount: request.refundAccount
      })

      return response as PaymentResponse
    } catch (error) {
      console.error('결제 취소 오류:', error)
      throw new Error('결제 취소에 실패했습니다.')
    }
  }

  // 주문 ID로 결제 조회
  async getPaymentByOrderId(orderId: string): Promise<PaymentResponse[]> {
    try {
      const response = await this.makeRequest(`/payments/orders/${orderId}`, 'GET')
      return response as PaymentResponse[]
    } catch (error) {
      console.error('주문 ID로 결제 조회 오류:', error)
      throw new Error('결제 조회에 실패했습니다.')
    }
  }

  // 결제 검증
  async verifyPayment(paymentKey: string, orderId: string, amount: number): Promise<boolean> {
    try {
      const payment = await this.getPayment(paymentKey)
      
      return (
        payment.orderId === orderId &&
        payment.amount === amount &&
        payment.status === 'DONE'
      )
    } catch (error) {
      console.error('결제 검증 오류:', error)
      return false
    }
  }
}

// 싱글톤 인스턴스
let tossPaymentsClient: TossPaymentsClient | null = null

export function getTossPaymentsClient(): TossPaymentsClient {
  if (!tossPaymentsClient) {
    tossPaymentsClient = new TossPaymentsClient()
  }
  return tossPaymentsClient
}

// 클라이언트 사이드용 토스페이먼츠 위젯 설정
export function getTossPaymentsWidget(clientKey: string) {
  if (typeof window === 'undefined') {
    throw new Error('TossPayments 위젯은 클라이언트 사이드에서만 사용할 수 있습니다.')
  }

  // TossPayments는 클라이언트에서 직접 import해야 함
  return loadTossPayments(clientKey)
}

// 결제 요청 데이터 검증
export function validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const MAX_PAYMENT_AMOUNT = 1000000 // 최대 100만원

  if (!request.orderId || request.orderId.trim() === '') {
    errors.push('주문 ID는 필수입니다.')
  }

  if (!request.amount || request.amount <= 0) {
    errors.push('결제 금액은 0보다 커야 합니다.')
  }

  // 최대 금액 검증
  if (request.amount > MAX_PAYMENT_AMOUNT) {
    errors.push(`최대 결제 금액은 ${MAX_PAYMENT_AMOUNT.toLocaleString()}원입니다.`)
  }

  if (!request.orderName || request.orderName.trim() === '') {
    errors.push('주문명은 필수입니다.')
  }

  if (!request.successUrl || request.successUrl.trim() === '') {
    errors.push('성공 URL은 필수입니다.')
  }

  if (!request.failUrl || request.failUrl.trim() === '') {
    errors.push('실패 URL은 필수입니다.')
  }

  if (!request.items || request.items.length === 0) {
    errors.push('결제 상품은 최소 1개 이상이어야 합니다.')
  }

  // 금액 검증
  const totalAmount = request.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  if (totalAmount !== request.amount) {
    errors.push('상품 금액의 합계와 결제 금액이 일치하지 않습니다.')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// 주문 ID 생성
export function generateOrderId(prefix: string = 'ORDER'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${prefix}_${timestamp}_${random}`
}

// 결제 금액 포맷팅
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

// 결제 상태 한글 변환
export function getPaymentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'READY': '결제 준비됨',
    'IN_PROGRESS': '결제 진행 중',
    'WAITING_FOR_DEPOSIT': '입금 대기 중',
    'DONE': '결제 완료',
    'CANCELED': '결제 취소됨',
    'PARTIAL_CANCELED': '부분 취소됨',
    'ABORTED': '결제 중단됨',
    'EXPIRED': '결제 만료됨'
  }

  return statusMap[status] || status
}
