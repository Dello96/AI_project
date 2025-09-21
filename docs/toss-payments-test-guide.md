# 토스 페이먼츠 테스트 결제 시스템 가이드

## 개요
토스 페이먼츠 테스트 API를 사용하여 구현된 가상 결제 시스템입니다. 실제 결제가 이루어지지 않으며, 테스트 목적으로만 사용됩니다.

## 설정된 API 키
- **Client Key**: `test_ck_24xLea5zVAJvxYx4yKQKrQAMYNwW`
- **Secret Key**: `test_sk_d46qopOB897QDwpEBRe7VZmM75y0`

## 테스트 방법

### 1. 테스트 결제 페이지
- URL: `http://localhost:3000/test-payment`
- 기능: 다양한 결제 금액과 고객 정보로 테스트 가능

### 2. 선교사님 후원 (메인 페이지)
- URL: `http://localhost:3000`
- 기능: 메인 페이지 하단의 "선교사님 후원" 섹션에서 후원금 결제 테스트

## 테스트 카드 정보
토스 페이먼츠에서 제공하는 테스트 카드 정보를 사용하세요:

### 성공 테스트 카드
- **카드번호**: 4000000000000004
- **유효기간**: 12/25 (또는 미래 날짜)
- **CVC**: 123
- **카드 비밀번호**: 1234

### 실패 테스트 카드
- **카드번호**: 4000000000000002 (결제 실패)
- **카드번호**: 4000000000000069 (카드 한도 초과)

## 결제 플로우

### 1. 결제 요청
```
사용자 입력 → /api/payments/redirect → 토스 페이먼츠 결제창
```

### 2. 결제 성공
```
토스 결제창 → /payment/success → /api/payments/confirm → DB 저장
```

### 3. 결제 실패
```
토스 결제창 → /payment/fail → 에러 메시지 표시
```

## API 엔드포인트

### `/api/payments/redirect` (GET)
결제창으로 리다이렉트하는 엔드포인트
- **파라미터**:
  - `amount`: 결제 금액
  - `orderId`: 주문 ID
  - `orderName`: 주문명
  - `customerName`: 고객명 (선택)
  - `customerEmail`: 고객 이메일 (선택)
  - `successUrl`: 성공 시 리다이렉트 URL
  - `failUrl`: 실패 시 리다이렉트 URL

### `/api/payments/confirm` (POST)
결제 승인을 처리하는 엔드포인트
- **Body**:
  ```json
  {
    "paymentKey": "결제 키",
    "orderId": "주문 ID",
    "amount": 결제금액
  }
  ```

### `/api/donations/stats` (GET)
후원 통계를 조회하는 엔드포인트
- **응답**:
  ```json
  {
    "totalAmount": 총후원금액,
    "totalCount": 총후원건수,
    "averageAmount": 평균후원금액,
    "recentDonations": []
  }
  ```

## 데이터베이스 저장
결제 성공 시 `payments` 테이블에 다음 정보가 저장됩니다:
- `payment_key`: 토스 페이먼츠 결제 키
- `order_id`: 주문 ID
- `amount`: 결제 금액
- `order_name`: 주문명
- `status`: 결제 상태 ('DONE')
- `method`: 결제 수단
- `approved_at`: 승인 시각
- `requested_at`: 요청 시각

## 주의사항
1. **테스트 환경**: 실제 결제가 이루어지지 않습니다.
2. **API 키**: 테스트용 API 키이므로 프로덕션에서 사용하지 마세요.
3. **카드 정보**: 반드시 토스 페이먼츠에서 제공하는 테스트 카드를 사용하세요.
4. **HTTPS**: 프로덕션 환경에서는 반드시 HTTPS를 사용해야 합니다.

## 트러블슈팅

### 결제창이 열리지 않는 경우
- 브라우저 팝업 차단 해제
- JavaScript 활성화 확인
- 네트워크 연결 상태 확인

### 결제 승인 실패
- 콘솔 로그에서 상세 에러 메시지 확인
- API 키 설정 재확인
- 결제 금액과 파라미터 일치 여부 확인

### 데이터베이스 저장 실패
- Supabase 연결 상태 확인
- `payments` 테이블 존재 여부 확인
- RLS 정책 설정 확인

## 로그 확인
개발 환경에서는 다음 로그를 확인할 수 있습니다:
- 브라우저 콘솔: 클라이언트 사이드 로그
- 터미널: 서버 사이드 API 로그
- Supabase 대시보드: 데이터베이스 저장 로그
