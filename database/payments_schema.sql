-- 결제 관련 테이블 추가
-- Supabase SQL Editor에서 실행하세요

-- 결제 테이블
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_key VARCHAR(255) NOT NULL UNIQUE,
  order_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL,
  order_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'READY',
  method VARCHAR(50),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_mobile_phone VARCHAR(20),
  approved_at TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 취소 내역 테이블
CREATE TABLE payment_cancels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE NOT NULL,
  cancel_id VARCHAR(255) NOT NULL,
  cancel_amount INTEGER NOT NULL,
  cancel_reason TEXT NOT NULL,
  tax_free_amount INTEGER DEFAULT 0,
  tax_exemption_amount INTEGER DEFAULT 0,
  refundable_amount INTEGER DEFAULT 0,
  easy_pay_discount_amount INTEGER DEFAULT 0,
  canceled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  transaction_key VARCHAR(255),
  receipt_key VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 환불 계좌 테이블
CREATE TABLE payment_refund_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE NOT NULL,
  bank VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  holder_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_payments_payment_key ON payments(payment_key);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payment_cancels_payment_id ON payment_cancels(payment_id);
CREATE INDEX idx_payment_refund_accounts_payment_id ON payment_refund_accounts(payment_id);

-- RLS 정책 설정
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_cancels ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refund_accounts ENABLE ROW LEVEL SECURITY;

-- 결제 테이블 RLS 정책
CREATE POLICY "Anyone can view payments" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create payments" ON payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payments" ON payments
  FOR UPDATE USING (true);

-- 결제 취소 테이블 RLS 정책
CREATE POLICY "Anyone can view payment cancels" ON payment_cancels
  FOR SELECT USING (true);

CREATE POLICY "System can create payment cancels" ON payment_cancels
  FOR INSERT WITH CHECK (true);

-- 결제 환불 계좌 테이블 RLS 정책
CREATE POLICY "Anyone can view refund accounts" ON payment_refund_accounts
  FOR SELECT USING (true);

CREATE POLICY "System can create refund accounts" ON payment_refund_accounts
  FOR INSERT WITH CHECK (true);

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 결제 상태 변경 로그 함수
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 결제 상태가 변경될 때 로그 기록
  IF OLD.status != NEW.status THEN
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      target_type,
      target_id,
      details
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', -- 시스템 사용자
      'payment_status_change',
      'payment',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'payment_key', NEW.payment_key,
        'order_id', NEW.order_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 결제 상태 변경 트리거
CREATE TRIGGER payment_status_change_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION log_payment_status_change();
