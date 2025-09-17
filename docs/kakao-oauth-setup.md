# 카카오 OAuth 설정 가이드

## 1. 카카오 개발자 콘솔 설정

### 1.1 애플리케이션 등록
1. [카카오 개발자 콘솔](https://developers.kakao.com/)에 접속
2. "내 애플리케이션" → "애플리케이션 추가하기" 클릭
3. 앱 이름: "PrayGround" (또는 원하는 이름)
4. 사업자명: "잠실중앙교회" (또는 원하는 이름)

### 1.2 플랫폼 설정
1. 생성된 앱 선택
2. "플랫폼" → "Web 플랫폼 등록"
3. 사이트 도메인: `http://localhost:3000` (개발용)
4. 사이트 도메인: `https://ai-project-f45i.vercel.app` (Vercel 배포용)
5. 사이트 도메인: `https://your-domain.com` (프로덕션용)

### 1.3 OAuth 리다이렉트 URI 설정
1. "제품 설정" → "카카오 로그인" → "Redirect URI"
2. 다음 URI들을 추가:
   - `http://localhost:3000/auth/callback` (개발용)
   - `https://ai-project-f45i.vercel.app/auth/callback` (Vercel 배포용)
   - `https://your-domain.com/auth/callback` (프로덕션용)

### 1.4 동의항목 설정
1. "제품 설정" → "카카오 로그인" → "동의항목"
2. 필수 동의항목:
   - 닉네임 (선택)
   - 카카오계정(이메일) (필수)
   - 프로필 사진 (선택)

### 1.5 앱 키 확인
1. "앱 설정" → "앱 키"에서 다음 정보 확인:
   - REST API 키 (Client ID)
   - Client Secret (보안을 위해 새로 생성)

## 2. Supabase 설정

### 2.1 Authentication 설정
1. Supabase 대시보드 → "Authentication" → "Providers"
2. "Kakao" 활성화
3. 다음 정보 입력:
   - Client ID: 카카오 개발자 콘솔의 REST API 키
   - Client Secret: 카카오 개발자 콘솔의 Client Secret

### 2.2 Redirect URLs 설정
1. "Authentication" → "URL Configuration"
2. Site URL: `https://ai-project-f45i.vercel.app` (Vercel 배포용)
3. Redirect URLs에 추가:
   - `http://localhost:3000/auth/callback` (개발용)
   - `https://ai-project-f45i.vercel.app/auth/callback` (Vercel 배포용)
   - `https://your-domain.com/auth/callback` (프로덕션용)

## 3. 환경 변수 설정

### 3.1 로컬 개발 환경 (.env.local)
```env
# 카카오 OAuth 설정
KAKAO_CLIENT_ID=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3.2 Vercel 배포 환경
Vercel 대시보드에서 환경 변수 설정:
1. 프로젝트 선택 → "Settings" → "Environment Variables"
2. 다음 변수들을 추가:
   - `KAKAO_CLIENT_ID`: 카카오 REST API 키
   - `KAKAO_CLIENT_SECRET`: 카카오 Client Secret
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key

## 4. 테스트

### 4.1 개발 환경 테스트
1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 `http://localhost:3000` 접속
3. 로그인 버튼 클릭
4. "카카오로 로그인" 버튼 클릭
5. 카카오 로그인 페이지로 리다이렉트 확인

### 4.2 프로덕션 배포 시 주의사항
1. 카카오 개발자 콘솔에서 프로덕션 도메인 추가
2. Supabase에서 프로덕션 Redirect URL 추가
3. 환경 변수를 프로덕션 환경에 설정

## 5. 문제 해결

### 5.1 일반적인 오류
- **"Invalid redirect_uri"**: 카카오 개발자 콘솔의 Redirect URI와 Supabase 설정이 일치하지 않음
- **"Invalid client"**: Client ID 또는 Client Secret이 잘못됨
- **"Access denied"**: 사용자가 로그인을 취소함

### 5.2 디버깅
1. 브라우저 개발자 도구의 Network 탭에서 요청 확인
2. Supabase 로그에서 인증 오류 확인
3. 카카오 개발자 콘솔의 "통계" 탭에서 요청 로그 확인

## 6. 보안 고려사항

1. **Client Secret 보안**: 절대 클라이언트 사이드에 노출하지 않음
2. **HTTPS 사용**: 프로덕션에서는 반드시 HTTPS 사용
3. **도메인 검증**: 허용된 도메인에서만 OAuth 요청 허용
4. **토큰 관리**: Supabase가 자동으로 관리하므로 별도 처리 불필요
