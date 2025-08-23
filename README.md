# 교회 청년부 커뮤니티 MVP

교회 청년부를 위한 안전하고 통합된 커뮤니티 플랫폼입니다.

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+ 
- npm 또는 yarn
- Supabase 계정

### ⚠️ 중요: Supabase 설정 필요
이 프로젝트를 실행하려면 먼저 Supabase 프로젝트를 설정해야 합니다. 자세한 설정 방법은 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)를 참조하세요.

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd ai_project
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI API (향후 확장 기능용)
OPENAI_API_KEY=your-openai-api-key-here

# Toss Payments (향후 확장 기능용)
TOSS_PAYMENTS_SECRET_KEY=your-toss-secret-key-here

# 개발 환경 설정
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**중요**: Supabase 프로젝트를 먼저 생성해야 합니다. 자세한 설정 방법은 `SUPABASE_SETUP.md`를 참조하세요.

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **UI Library**: Shadcn UI, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deployment**: Vercel
- **Styling**: TailwindCSS + 커스텀 디자인 시스템

## 📁 프로젝트 구조

```
ai_project/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈페이지
│   └── globals.css        # 전역 스타일
├── components/             # 재사용 가능한 컴포넌트
│   ├── ui/                # 기본 UI 컴포넌트
│   ├── auth/              # 인증 관련 컴포넌트
│   ├── board/             # 게시판 컴포넌트
│   └── calendar/          # 캘린더 컴포넌트
├── hooks/                  # 커스텀 훅
├── lib/                    # 유틸리티 및 설정
├── types/                  # TypeScript 타입 정의
└── database/               # 데이터베이스 스키마
```

## 🎯 주요 기능

### MVP 기능 (1차 출시)
- [x] **프로젝트 구조 및 디자인 시스템** ✅
- [x] **기본 UI 컴포넌트** ✅
- [x] **메인 페이지 레이아웃** ✅
- [ ] **Supabase 백엔드 설정** 🔄
- [ ] **인증 시스템** 📋
- [ ] **게시판 CRUD** 📋
- [ ] **캘린더 기능** 📋
- [ ] **알림 시스템** 📋

### 확장 기능 (2차 출시)
- [ ] **파일 업로드 시스템**
- [ ] **권한 관리 시스템**
- [ ] **PWA 기능**
- [ ] **성능 최적화**

## 🔧 개발 가이드

### 코드 스타일
- TypeScript 엄격 모드 사용
- ESLint + Prettier 설정
- 컴포넌트 기반 아키텍처
- TailwindCSS 유틸리티 클래스 활용

### 브랜치 전략
- `main`: 프로덕션 배포
- `develop`: 개발 통합
- `feature/*`: 기능 개발
- `hotfix/*`: 긴급 수정

## 📚 문서

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 설정 가이드
- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) - 개발 로드맵
- [API 문서](./docs/api.md) - API 엔드포인트 문서

## 🚨 문제 해결

### 일반적인 문제들
1. **"Missing Supabase environment variables"**
   - `.env.local` 파일이 프로젝트 루트에 있는지 확인
   - Supabase 프로젝트가 생성되었는지 확인

2. **빌드 오류**
   - `npm install` 재실행
   - `.next` 캐시 삭제 후 재시작

3. **타입 오류**
   - `types/` 폴더의 타입 정의 확인
   - TypeScript 컴파일러 재시작

## 🤝 기여하기

1. 이슈 생성 또는 기존 이슈 확인
2. 기능 브랜치 생성 (`feature/기능명`)
3. 코드 작성 및 테스트
4. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 발생하거나 질문이 있으시면:
1. [GitHub Issues](https://github.com/your-repo/issues) 확인
2. 개발팀에 문의
3. `SUPABASE_SETUP.md` 가이드 참조

---

**🎯 다음 단계**: Supabase 프로젝트 생성 및 환경 변수 설정
**📖 참고 문서**: `SUPABASE_SETUP.md`에서 상세한 설정 방법 확인
