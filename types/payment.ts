// 토스페이먼츠 결제 관련 타입 정의

export interface PaymentItem {
  id: string
  name: string
  price: number
  quantity: number
  category?: string
  description?: string
}

export interface PaymentRequest {
  orderId: string
  amount: number
  orderName: string
  customerName?: string
  customerEmail?: string
  customerMobilePhone?: string
  successUrl: string
  failUrl: string
  items: PaymentItem[]
  validHours?: number
  useEscrow?: boolean
  escrowProducts?: string[]
  cultureExpense?: boolean
  taxFreeAmount?: number
  taxExemptionAmount?: number
}

export interface PaymentResponse {
  paymentKey: string
  orderId: string
  amount: number
  orderName: string
  status: PaymentStatus
  approvedAt?: string
  requestedAt: string
  receipt?: {
    url: string
  }
  checkout?: {
    url: string
  }
  cancels?: PaymentCancel[]
  secret?: string
  type?: string
  easyPay?: {
    provider: string
    amount: number
    discountAmount: number
  }
  country?: string
  failure?: {
    code: string
    message: string
  }
  totalDiscountAmount?: number
  balanceAmount?: number
  suppliedAmount?: number
  vat?: number
  taxFreeAmount?: number
  method?: string
  version?: string
}

export interface PaymentCancel {
  cancelId: string
  cancelAmount: number
  cancelReason: string
  taxFreeAmount?: number
  taxExemptionAmount?: number
  refundableAmount?: number
  easyPayDiscountAmount?: number
  canceledAt: string
  transactionKey?: string
  receiptKey?: string
}

export type PaymentStatus = 
  | 'READY'           // 결제 준비됨
  | 'IN_PROGRESS'     // 결제 진행 중
  | 'WAITING_FOR_DEPOSIT' // 입금 대기 중
  | 'DONE'            // 결제 완료
  | 'CANCELED'        // 결제 취소됨
  | 'PARTIAL_CANCELED' // 부분 취소됨
  | 'ABORTED'         // 결제 중단됨
  | 'EXPIRED'         // 결제 만료됨

export interface PaymentMethod {
  method: '카드' | '가상계좌' | '계좌이체' | '휴대폰' | '상품권' | '도서문화상품권' | '게임문화상품권'
  easyPay?: string
}

export interface PaymentWidgetOptions {
  brandPayOption?: {
    redirectUrl?: string
  }
  agreement?: {
    useAgreement?: boolean
    useDiscountAgreement?: boolean
    useCashReceiptAgreement?: boolean
    usePointAgreement?: boolean
    useCouponAgreement?: boolean
  }
  customer?: {
    name?: string
    email?: string
    mobilePhone?: string
  }
  discount?: {
    amount?: number
  }
  point?: {
    amount?: number
  }
  coupon?: {
    amount?: number
  }
}

// 결제 내역 타입
export interface PaymentHistory {
  id: string
  orderId: string
  paymentKey: string
  amount: number
  orderName: string
  status: PaymentStatus
  method?: string
  requestedAt: string
  approvedAt?: string
  canceledAt?: string
  customerName?: string
  customerEmail?: string
  customerMobilePhone?: string
  items: PaymentItem[]
  createdAt: Date
  updatedAt: Date
}

// 결제 검증 요청
export interface PaymentVerificationRequest {
  paymentKey: string
  orderId: string
  amount: number
}

// 결제 취소 요청
export interface PaymentCancelRequest {
  paymentKey: string
  cancelReason: string
  cancelAmount?: number
  taxFreeAmount?: number
  taxExemptionAmount?: number
  refundableAmount?: number
  currency?: string
  refundAccount?: {
    bank: string
    accountNumber: string
    holderName: string
  }
}

// 결제 에러 타입
export interface PaymentError {
  code: string
  message: string
  orderId?: string
  paymentKey?: string
}

// 결제 위젯 이벤트 타입
export interface PaymentWidgetEvents {
  onReady?: () => void
  onLoad?: () => void
  onError?: (error: PaymentError) => void
  onSuccess?: (response: PaymentResponse) => void
  onFail?: (error: PaymentError) => void
  onCancel?: (error: PaymentError) => void
}
