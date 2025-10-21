# Supabase 자동 토큰 관리 통합 가이드

## 📋 변경 사항 요약

기존의 커스텀 JWT 토큰 관리 방식에서 **Supabase 네이티브 자동 토큰 관리**로 통합했습니다.

### 주요 변경 사항

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| **토큰 관리** | 커스텀 JWT + Supabase 이중 시스템 | Supabase 단일 시스템 |
| **토큰 갱신** | 수동 (setInterval, setTimeout) | 자동 (Supabase autoRefreshToken) |
| **쿠키** | access_token, refresh_token, sb-* | Supabase localStorage 관리 |
| **상태 감지** | 수동 checkUser() | onAuthStateChange 자동 감지 |
| **코드 복잡도** | 높음 (중복 로직) | 낮음 (Supabase에 위임) |

---

## 🔧 기술 상세

### 1. Supabase 클라이언트 설정 (`lib/supabase.ts`)

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,        // ✅ 자동 토큰 갱신 활성화
    persistSession: true,           // ✅ 브라우저에 세션 유지
    detectSessionInUrl: true,       // ✅ OAuth 콜백 URL 감지
    storage: window.localStorage    // ✅ localStorage에 세션 저장
  }
})
```

**작동 원리:**
- Supabase는 액세스 토큰이 만료되기 전에 **자동으로 갱신**합니다
- localStorage에 세션을 저장하여 페이지 새로고침 시에도 유지됩니다
- 갱신 실패 시 자동으로 로그아웃 처리됩니다

---

### 2. 통합 인증 상태 관리 (`stores/authStore.ts`)

```typescript
// Supabase Auth 상태 변경 자동 감지
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    // 로그인 시 사용자 정보 업데이트
  } else if (event === 'SIGNED_OUT') {
    // 로그아웃 시 상태 초기화
  } else if (event === 'TOKEN_REFRESHED') {
    // 토큰 자동 갱신 완료
    console.log('✅ 토큰이 자동으로 갱신되었습니다.')
  } else if (event === 'USER_UPDATED') {
    // 사용자 정보 업데이트
  }
})
```

**이벤트 타입:**
- `SIGNED_IN`: 로그인 성공
- `SIGNED_OUT`: 로그아웃
- `TOKEN_REFRESHED`: 토큰 자동 갱신
- `USER_UPDATED`: 사용자 정보 변경
- `PASSWORD_RECOVERY`: 비밀번호 복구

---

### 3. 단순화된 useAuth 훅 (`hooks/useAuth.ts`)

**변경 전:**
```typescript
// 250줄 이상의 복잡한 로직
- checkUser()
- refreshToken()
- setInterval 타이머
- 수동 상태 관리
```

**변경 후:**
```typescript
// 70줄의 간결한 래퍼
export function useAuth() {
  const authStore = useAuthStore()
  
  useEffect(() => {
    const cleanup = await authStore.initializeAuth()
    return () => cleanup?.()
  }, [])
  
  return {
    user: authStore.user,
    signIn: authStore.signIn,
    signOut: authStore.signOut,
    // ...
  }
}
```

**개선 효과:**
- 코드 라인 수 **70% 감소**
- 불필요한 타이머 제거
- authStore에 단일 진실 공급원 집중

---

### 4. 로그인 API 단순화 (`app/api/auth/login/route.ts`)

**제거된 코드:**
```typescript
// ❌ 더 이상 필요 없음
- createJWT()
- createRefreshToken()
- setAuthCookies()
- 수동 쿠키 설정
- refresh_tokens 테이블 저장
```

**현재 코드:**
```typescript
// ✅ Supabase가 자동 처리
const { data: authData, error } = await supabase.auth.signInWithPassword({
  email,
  password
})

// Supabase가 자동으로 localStorage에 세션 저장
// 별도의 토큰 생성이나 쿠키 설정 불필요
```

---

### 5. Middleware 개선 (`middleware.ts`)

**변경 전:**
```typescript
// 수동 쿠키 확인
const accessToken = request.cookies.get('access_token')?.value
if (!accessToken) redirect('/login')
```

**변경 후:**
```typescript
// Supabase 세션 검증
const supabase = createMiddlewareClient({ req, res })
const { data: { session } } = await supabase.auth.getSession()
if (!session) redirect('/login')
```

**장점:**
- Supabase의 검증된 세션 확인 메커니즘 사용
- 자동 토큰 갱신 지원
- 보안 강화

---

## 🕐 토큰 만료 시간

| 토큰 타입 | 만료 시간 | 저장 위치 | 자동 갱신 |
|----------|----------|----------|----------|
| Access Token | **1시간** | localStorage | ✅ 자동 |
| Refresh Token | **30일** | localStorage | ✅ 자동 |

**Supabase 기본 설정:**
- 액세스 토큰은 **1시간** 후 만료
- 만료 **5분 전**에 자동 갱신 시도
- 리프레시 토큰은 **30일** 유효
- 갱신 실패 시 자동 로그아웃

---

## 🔒 보안 개선

### localStorage vs HttpOnly Cookie

| 측면 | localStorage | HttpOnly Cookie |
|------|--------------|-----------------|
| XSS 공격 | 취약 (JavaScript 접근 가능) | 안전 (JavaScript 접근 불가) |
| CSRF 공격 | 안전 | 취약 (하지만 SameSite로 방어) |
| 편의성 | 높음 | 중간 |
| Supabase 권장 | ✅ **권장** | 가능하지만 복잡 |

**Supabase의 선택:**
- localStorage 사용이 **공식 권장 방식**
- XSS 방어는 **Content Security Policy (CSP)**로 처리
- 대부분의 모던 애플리케이션은 localStorage 사용

**추가 보안 조치:**
1. **CSP 헤더 설정** (XSS 방어)
2. **HTTPS 강제** (전송 중 암호화)
3. **Rate Limiting** (Brute Force 방어) ✅ 이미 구현됨
4. **Audit Logging** (감사 추적) ✅ 이미 구현됨

---

## 📊 성능 개선

### 불필요한 API 호출 감소

**변경 전:**
```
로그인 → 14분마다 갱신 요청 → 서버 부하
```

**변경 후:**
```
로그인 → 만료 5분 전 자동 갱신 → 최적화된 타이밍
```

**예상 효과:**
- API 요청 **약 75% 감소**
- 불필요한 네트워크 트래픽 제거
- 서버 부하 감소

---

## 🧪 테스트 체크리스트

### 기능 테스트
- [x] 로그인 성공 시 세션 저장
- [x] 페이지 새로고침 시 세션 유지
- [x] 1시간 후 자동 토큰 갱신
- [x] 로그아웃 시 세션 삭제
- [x] 보호된 라우트 접근 제어

### 보안 테스트
- [x] 레이트 리밋 (5회 실패 시 15분 차단)
- [x] 감사 로그 기록
- [x] 승인되지 않은 사용자 차단
- [ ] CSP 헤더 설정 (추후 구현)

### 성능 테스트
- [x] 초기 로딩 속도
- [x] 메모리 사용량 (타이머 제거로 개선)
- [x] 네트워크 요청 최적화

---

## 🚀 배포 가이드

### 1. 환경 변수 확인

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. 빌드 및 테스트

```bash
npm run build
npm run start
```

### 3. 프로덕션 체크리스트

- [ ] Supabase 프로젝트 설정 확인
- [ ] RLS (Row Level Security) 정책 활성화
- [ ] HTTPS 강제 설정
- [ ] 에러 모니터링 설정 (Sentry 등)
- [ ] 성능 모니터링 설정

---

## 📚 추가 참고 자료

- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [Supabase Auth Helpers - Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [JWT vs Session 비교](https://supabase.com/docs/guides/auth/sessions)

---

## 🤝 기여

문제가 발생하거나 개선 제안이 있으시면 이슈를 생성해주세요.

---

## 📝 변경 이력

### v2.0.0 (2025-01-21)
- ✅ Supabase 자동 토큰 관리 통합
- ✅ 커스텀 JWT 제거
- ✅ 중복 토큰 갱신 로직 제거
- ✅ useAuth 훅 단순화
- ✅ 코드 복잡도 70% 감소

### v1.0.0 (이전)
- 커스텀 JWT + Supabase 이중 시스템
- 수동 토큰 갱신 (setInterval)

