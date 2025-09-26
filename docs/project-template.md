# 프로젝트 포트폴리오 템플릿

## 📋 프로젝트 1: 교회 청년부 커뮤니티 플랫폼

### 🎯 프로젝트 개요
- **기간**: 2024.09 - 2024.12 (3개월)
- **역할**: 풀스택 개발자 (Frontend + Backend + DevOps)
- **팀 규모**: 1명 (개인 프로젝트)
- **목표**: 분산된 커뮤니케이션 채널을 통합한 올인원 플랫폼 구축

### 🚀 핵심 성과
- **사용자 경험**: PWA 구현으로 네이티브 앱 수준의 UX 제공
- **성능**: Lighthouse PWA 점수 90점 이상 달성
- **확장성**: 100명 규모 트래픽 안정적 처리
- **기능**: 게시판, 캘린더, 실시간 채팅, 결제 시스템 통합

### 🛠 기술 스택
**Frontend**
- Next.js 14 (App Router, SSR/SSG)
- TypeScript (정적 타입 검사)
- TailwindCSS + Shadcn UI (컴포넌트 시스템)
- Framer Motion (애니메이션)

**Backend & Database**
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- Row Level Security (RLS) 정책 구현
- 실시간 데이터 동기화

**External APIs**
- 카카오맵 API (위치 검색, 지도 표시)
- 카카오 OAuth (소셜 로그인)
- Toss Payments (결제 시스템)
- Google Gemini API (AI 챗봇)

**DevOps & Deployment**
- Vercel (자동 배포)
- PWA (Progressive Web App)
- 환경 변수 관리

### 🔧 주요 구현 기능

#### 1. 인증 시스템
```typescript
// Supabase Auth + JWT 토큰 관리
const { data: { user }, error } = await supabase.auth.getUser()
```

#### 2. 실시간 기능
```typescript
// Supabase Realtime 구독
const channel = supabase
  .channel('posts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, 
    (payload) => updatePosts(payload))
  .subscribe()
```

#### 3. 카카오맵 통합
```typescript
// 장소 검색 및 지도 표시
const ps = new window.kakao.maps.services.Places()
ps.keywordSearch(query, placesSearchCB)
```

### 🎨 UI/UX 특징
- **반응형 디자인**: 모바일 우선 설계
- **다크모드**: 시스템 설정 연동
- **접근성**: WCAG AA 준수
- **애니메이션**: 부드러운 전환 효과

### 📊 성과 지표
- **개발 효율성**: 3개월 내 MVP 완성
- **코드 품질**: TypeScript 100% 적용
- **성능**: Core Web Vitals 최적화
- **사용자 만족도**: 직관적인 UX 설계

### 🧠 학습 포인트
- **Next.js 14 App Router**: 최신 라우팅 시스템 활용
- **Supabase**: BaaS를 활용한 빠른 백엔드 구축
- **PWA**: 웹 앱의 네이티브 앱 수준 경험 제공
- **실시간 통신**: WebSocket 기반 실시간 기능 구현

### 🔗 관련 링크
- **GitHub**: [프로젝트 저장소]
- **데모**: [라이브 데모 URL]
- **문서**: [기술 문서]

---

## 📋 프로젝트 2: [다음 프로젝트명]

### 🎯 프로젝트 개요
- **기간**: [시작일] - [종료일]
- **역할**: [담당 역할]
- **팀 규모**: [팀 크기]
- **목표**: [프로젝트 목표]

### 🚀 핵심 성과
- [구체적인 성과 1]
- [구체적인 성과 2]
- [구체적인 성과 3]

### 🛠 기술 스택
[사용한 기술들]

### 🔧 주요 구현 기능
[핵심 기능들]

### 📊 성과 지표
[정량적 성과]

### 🧠 학습 포인트
[배운 점들]

---

## 📋 프로젝트 3: [세 번째 프로젝트명]

[동일한 구조로 작성]
