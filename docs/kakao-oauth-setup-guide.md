# 카카오 OAuth 설정 가이드 (Vercel 배포용)

## 🚨 문제 상황
Vercel에 배포된 앱에서 카카오 로그인 시 "localhost에서 연결을 거부했다"는 오류가 발생합니다.

## 🔍 원인 분석
1. **카카오 개발자 콘솔의 리다이렉트 URL이 localhost로 설정됨**
2. **Vercel 배포 URL이 카카오 개발자 콘솔에 등록되지 않음**
3. **환경 변수 설정 문제**

## 🛠 해결 방법

### 1단계: 카카오 개발자 콘솔 설정

#### **1.1 카카오 개발자 콘솔 접속**
1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 로그인 후 해당 애플리케이션 선택

#### **1.2 플랫폼 설정**
**내 애플리케이션 > 앱 설정 > 플랫폼**에서:

**Web 플랫폼 추가/수정:**
```
사이트 도메인: https://your-app-name.vercel.app
```

#### **1.3 카카오 로그인 설정**
**내 애플리케이션 > 제품 설정 > 카카오 로그인**에서:

**Redirect URI 설정:**
```
기존: http://localhost:3000/auth/callback
추가: https://your-app-name.vercel.app/auth/callback
```

**동의항목 설정:**
- 필수: 닉네임, 카카오계정(이메일)
- 선택: 프로필 사진, 연령대, 성별

### 2단계: Vercel 환경 변수 설정

#### **2.1 Vercel 대시보드에서 환경 변수 추가**
1. Vercel 프로젝트 대시보드 접속
2. **Settings > Environment Variables** 이동
3. 다음 환경 변수 추가:

```env
# 기존 환경 변수
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_map_api_key

# 새로 추가할 환경 변수
NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
```

#### **2.2 Supabase 설정 확인**
**Supabase Dashboard > Authentication > URL Configuration**에서:

**Site URL:**
```
https://your-app-name.vercel.app
```

**Redirect URLs:**
```
http://localhost:3000/auth/callback
https://your-app-name.vercel.app/auth/callback
```

### 3단계: 코드 확인 및 수정

#### **3.1 현재 코드 상태 확인**
현재 `app/api/auth/kakao/route.ts`에서:
```typescript
redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
```

이 코드는 올바르게 설정되어 있습니다.

#### **3.2 환경 변수 우선순위 확인**
```typescript
// 프로덕션 환경에서는 Vercel의 NEXT_PUBLIC_SITE_URL 사용
// 개발 환경에서는 localhost 사용
const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
```

### 4단계: 테스트 및 검증

#### **4.1 로컬 테스트**
```bash
# 로컬에서 테스트
npm run dev
# http://localhost:3000에서 카카오 로그인 테스트
```

#### **4.2 Vercel 배포 테스트**
```bash
# Vercel에 배포
vercel --prod
# https://your-app-name.vercel.app에서 카카오 로그인 테스트
```

## 🔧 추가 설정 사항

### **1. 도메인 설정 (선택사항)**
커스텀 도메인을 사용하는 경우:

**카카오 개발자 콘솔:**
```
사이트 도메인: https://your-custom-domain.com
Redirect URI: https://your-custom-domain.com/auth/callback
```

**Vercel 환경 변수:**
```env
NEXT_PUBLIC_SITE_URL=https://your-custom-domain.com
```

### **2. HTTPS 설정 확인**
- Vercel은 자동으로 HTTPS를 제공합니다
- 카카오 OAuth는 HTTPS를 요구하므로 HTTP는 사용할 수 없습니다

### **3. CORS 설정**
Supabase에서 CORS 설정이 올바른지 확인:
```json
{
  "allowed_origins": [
    "http://localhost:3000",
    "https://your-app-name.vercel.app"
  ]
}
```

## 🚨 주의사항

### **1. 보안**
- `KAKAO_CLIENT_SECRET`은 절대 클라이언트에 노출되지 않도록 주의
- 환경 변수는 Vercel의 Environment Variables에서만 설정

### **2. 테스트**
- 로컬과 프로덕션 환경을 모두 테스트
- 다양한 브라우저에서 테스트

### **3. 모니터링**
- Vercel 로그에서 오류 확인
- Supabase 로그에서 인증 오류 확인

## 📞 문제 해결

### **문제 1: "localhost에서 연결을 거부했다"**
**해결**: 카카오 개발자 콘솔에 Vercel URL 추가

### **문제 2: "Invalid redirect URI"**
**해결**: Redirect URI가 정확히 일치하는지 확인

### **문제 3: "Client ID not found"**
**해결**: 환경 변수 `KAKAO_CLIENT_ID` 설정 확인

### **문제 4: CORS 오류**
**해결**: Supabase CORS 설정에 Vercel URL 추가

## ✅ 체크리스트

- [ ] 카카오 개발자 콘솔에 Vercel URL 등록
- [ ] Vercel 환경 변수 설정
- [ ] Supabase URL Configuration 업데이트
- [ ] 로컬 테스트 통과
- [ ] Vercel 배포 테스트 통과
- [ ] 다양한 브라우저에서 테스트

---

**구현 완료일**: 2024년 12월 26일  
**버전**: 1.0.0  
**담당자**: 개발팀
