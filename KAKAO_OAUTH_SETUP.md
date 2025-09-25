# 카카오 OAuth 설정 가이드

## 1. 카카오 개발자 콘솔 설정

### 1.1 카카오 개발자 계정 생성
1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 카카오 계정으로 로그인
3. "내 애플리케이션" 메뉴 클릭

### 1.2 애플리케이션 등록
1. "애플리케이션 추가하기" 클릭
2. 애플리케이션 정보 입력:
   - **앱 이름**: 교회 청년부 커뮤니티
   - **사업자명**: 교회명 또는 개인명
3. "저장" 클릭

### 1.3 플랫폼 설정
1. 생성된 애플리케이션 선택
2. "플랫폼" 메뉴 클릭
3. "Web 플랫폼 등록" 클릭
4. 사이트 도메인 등록:
   - **개발 환경**: `http://localhost:3000`
   - **프로덕션 환경**: `https://your-vercel-app.vercel.app`

### 1.4 제품 설정
1. "제품 설정" 메뉴 클릭
2. "카카오 로그인" 활성화
3. "동의항목" 설정:
   - **필수 동의항목**:
     - 닉네임 (선택)
     - 카카오계정(이메일) (선택)
   - **선택 동의항목**:
     - 프로필 사진 (선택)

### 1.5 Redirect URI 설정
1. "제품 설정" > "카카오 로그인" > "Redirect URI" 설정
2. 다음 URI 추가:
   - `http://localhost:3000/auth/callback`
   - `https://your-vercel-app.vercel.app/auth/callback`

## 2. Supabase 설정

### 2.1 Supabase 대시보드 접속
1. [Supabase 대시보드](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택

### 2.2 Authentication 설정
1. 왼쪽 메뉴에서 "Authentication" 클릭
2. "Providers" 탭 선택
3. "Kakao" 찾아서 활성화
4. 다음 정보 입력:
   - **Client ID**: 카카오 개발자 콘솔의 "앱 키" > "REST API 키"
   - **Client Secret**: 카카오 개발자 콘솔의 "보안" > "Client Secret"

### 2.3 Site URL 설정
1. "Authentication" > "URL Configuration" 메뉴
2. **Site URL** 설정:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://your-vercel-app.vercel.app`
3. **Redirect URLs** 추가:
   - `http://localhost:3000/auth/callback`
   - `https://your-vercel-app.vercel.app/auth/callback`

## 3. 환경 변수 설정

### 3.1 .env.local 파일에 추가
```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 사이트 URL (카카오 OAuth용)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # 개발 환경
# NEXT_PUBLIC_SITE_URL=https://your-vercel-app.vercel.app  # 프로덕션 환경
```

### 3.2 Vercel 환경 변수 설정
1. Vercel 대시보드 접속
2. 프로젝트 선택
3. "Settings" > "Environment Variables" 메뉴
4. 다음 변수 추가:
   - `NEXT_PUBLIC_SITE_URL`: `https://your-vercel-app.vercel.app`

## 4. 테스트 방법

### 4.1 개발 환경 테스트
1. `npm run dev` 실행
2. `http://localhost:3000/login` 접속
3. "카카오로 로그인" 버튼 클릭
4. 카카오 로그인 페이지에서 로그인
5. 자동으로 `/auth/callback`으로 리다이렉트
6. 메인 페이지로 이동 확인

### 4.2 프로덕션 환경 테스트
1. Vercel에 배포
2. 배포된 URL의 `/login` 페이지 접속
3. 카카오 로그인 테스트

## 5. 문제 해결

### 5.1 일반적인 오류
- **"잘못된 요청입니다"**: Redirect URI가 정확히 설정되었는지 확인
- **"앱이 등록되지 않았습니다"**: Client ID와 Client Secret이 올바른지 확인
- **"권한이 없습니다"**: 카카오 개발자 콘솔에서 동의항목이 올바르게 설정되었는지 확인

### 5.2 로그 확인
- 브라우저 개발자 도구 콘솔에서 오류 메시지 확인
- Supabase 대시보드의 "Logs" 메뉴에서 인증 로그 확인

## 6. 보안 고려사항

1. **Client Secret 보안**: 절대 클라이언트 사이드에 노출하지 않음
2. **Redirect URI 검증**: 정확한 도메인만 허용
3. **HTTPS 사용**: 프로덕션 환경에서는 반드시 HTTPS 사용
4. **토큰 만료**: 적절한 토큰 만료 시간 설정

## 7. 추가 기능

### 7.1 사용자 프로필 연동
- 카카오 로그인 시 자동으로 사용자 프로필 생성
- 카카오 프로필 정보 (닉네임, 프로필 사진) 연동

### 7.2 로그아웃 처리
- 카카오 계정과의 연동 해제 옵션 제공
- 로컬 세션과 카카오 세션 모두 정리

이 설정을 완료하면 카카오 계정으로 간편하게 로그인할 수 있습니다! 🎉
