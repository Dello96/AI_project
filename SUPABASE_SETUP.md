# Supabase 재세팅 가이드

기존 Supabase 연결이 끊겼을 때, 이 프로젝트 기준으로 빠르게 다시 연결하는 절차입니다.

## 1) 새 Supabase 프로젝트 생성
1. [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트를 생성합니다.
2. 프로젝트 생성 완료 후 아래 값을 복사합니다.
   - Project URL
   - anon key
   - service_role key

## 2) 환경 변수 갱신
프로젝트 루트에서:

```bash
cp .env.example .env.local
```

`.env.local`에서 아래 3개는 반드시 실제 값으로 교체하세요.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 3) DB 스키마 적용
Supabase SQL Editor에서 최소 아래 순서대로 실행하세요.

1. `database/schema.sql`
2. 기능에 따라 필요한 SQL 파일
   - `database/add_event_attendance.sql`
   - `database/add_location_data_column.sql`
   - `database/add_user_stats_columns.sql`
   - `database/add_attachments_column.sql`
   - `database/add-liked-by-column.sql`
   - `database/payments_schema.sql`

> 이미 반영된 SQL은 `IF NOT EXISTS` 구문 덕분에 대부분 안전하게 재실행 가능합니다.

## 4) 연결 점검
아래 명령으로 URL, DNS, 키, 핵심 테이블 접근을 한 번에 확인합니다.

```bash
npm run check:supabase
```

성공 기준:
- URL 형식 정상
- DNS 조회 성공
- anon key 조회 성공
- service role로 핵심 테이블 접근 성공

## 5) 개발 서버 확인

```bash
npm run dev
```

로그인/게시판/이벤트 API가 정상 동작하면 재세팅 완료입니다.

## 자주 발생하는 실패 원인
- `Could not resolve host`: 잘못된 project ref 또는 삭제된 프로젝트 URL
- `Invalid API key`: anon/service role 키 오입력
- `relation "...\" does not exist`: `database/schema.sql` 미적용
- RLS 에러: 정책 SQL 누락 또는 role별 권한 누락