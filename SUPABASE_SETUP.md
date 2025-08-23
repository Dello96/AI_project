# Supabase 프로젝트 설정 가이드

## 🚀 1단계: Supabase 프로젝트 생성

### 1.1 Supabase 계정 생성
1. [Supabase](https://supabase.com)에 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭

### 1.2 프로젝트 설정
- **Organization**: 개인 계정 또는 팀 선택
- **Project Name**: `youth-community` (또는 원하는 이름)
- **Database Password**: 안전한 비밀번호 설정 (기억해두세요!)
- **Region**: `Asia Pacific (Northeast) - Tokyo` (한국에서 가장 빠름)
- **Pricing Plan**: Free tier 선택

### 1.3 프로젝트 생성 완료
- 프로젝트 생성에는 약 2-3분 소요
- 생성 완료 후 프로젝트 대시보드로 이동

## 🔑 2단계: 환경 변수 설정

### 2.1 프로젝트 정보 확인
Supabase 대시보드에서 다음 정보를 확인하세요:

1. **Project URL**: `https://[project-id].supabase.co`
2. **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2.2 .env.local 파일 생성
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# OpenAI API (향후 확장 기능용)
OPENAI_API_KEY=[your-openai-api-key]

# Toss Payments (향후 결제 기능용)
TOSS_PAYMENTS_SECRET_KEY=[your-toss-secret-key]
TOSS_PAYMENTS_CLIENT_KEY=[your-toss-client-key]

# NextAuth 설정
NEXTAUTH_SECRET=[your-nextauth-secret-here]
NEXTAUTH_URL=http://localhost:3000
```

## 🗄️ 3단계: 데이터베이스 스키마 설정

### 3.1 SQL 에디터에서 스키마 실행
Supabase 대시보드의 SQL 에디터에서 다음 스키마를 실행하세요:

```sql
-- 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  church_domain TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'leader', 'admin')),
  avatar_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게시글 테이블
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('notice', 'free', 'qna')),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 댓글 테이블
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 일정 테이블
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  category TEXT NOT NULL CHECK (category IN ('worship', 'event', 'small_group', 'other')),
  is_all_day BOOLEAN DEFAULT false,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 알림 테이블
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('post', 'event', 'system')),
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 파일 업로드 테이블
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_events_date ON events(start_date, end_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

### 3.2 Row Level Security (RLS) 정책 설정

```sql
-- 프로필 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 프로필 정책
CREATE POLICY "사용자는 자신의 프로필을 볼 수 있음" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "사용자는 자신의 프로필을 수정할 수 있음" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "관리자는 모든 프로필을 볼 수 있음" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 게시글 RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 게시글 정책
CREATE POLICY "모든 사용자가 게시글을 볼 수 있음" ON posts
  FOR SELECT USING (true);

CREATE POLICY "인증된 사용자가 게시글을 작성할 수 있음" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "작성자만 게시글을 수정/삭제할 수 있음" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "작성자만 게시글을 삭제할 수 있음" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- 댓글 RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 댓글 정책
CREATE POLICY "모든 사용자가 댓글을 볼 수 있음" ON comments
  FOR SELECT USING (true);

CREATE POLICY "인증된 사용자가 댓글을 작성할 수 있음" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "작성자만 댓글을 수정/삭제할 수 있음" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "작성자만 댓글을 삭제할 수 있음" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- 일정 RLS 활성화
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 일정 정책
CREATE POLICY "모든 사용자가 일정을 볼 수 있음" ON events
  FOR SELECT USING (true);

CREATE POLICY "인증된 사용자가 일정을 작성할 수 있음" ON events
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "작성자만 일정을 수정/삭제할 수 있음" ON events
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "작성자만 일정을 삭제할 수 있음" ON events
  FOR DELETE USING (auth.uid() = author_id);

-- 알림 RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 알림 정책
CREATE POLICY "사용자는 자신의 알림만 볼 수 있음" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "시스템이 알림을 생성할 수 있음" ON notifications
  FOR INSERT WITH CHECK (true);

-- 파일 RLS 활성화
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 파일 정책
CREATE POLICY "모든 사용자가 파일을 볼 수 있음" ON files
  FOR SELECT USING (true);

CREATE POLICY "인증된 사용자가 파일을 업로드할 수 있음" ON files
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
```

## 🔐 4단계: 인증 설정

### 4.1 이메일 템플릿 설정
1. Supabase 대시보드에서 **Authentication** → **Email Templates** 이동
2. **Confirm signup** 템플릿을 한국어로 수정
3. **Invite user** 템플릿 설정 (관리자용)

### 4.2 소셜 로그인 설정 (선택사항)
1. **Authentication** → **Providers** 이동
2. Google, GitHub 등 원하는 소셜 로그인 활성화
3. OAuth 클라이언트 ID와 시크릿 설정

## 📱 5단계: 스토리지 설정

### 5.1 스토리지 버킷 생성
1. **Storage** → **Buckets** 이동
2. **New bucket** 클릭하여 다음 버킷 생성:
   - `avatars`: 사용자 프로필 이미지
   - `posts`: 게시글 첨부 파일
   - `events`: 일정 관련 파일

### 5.2 스토리지 정책 설정

```sql
-- 아바타 버킷 정책
CREATE POLICY "사용자는 자신의 아바타를 업로드할 수 있음" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "모든 사용자가 아바타를 볼 수 있음" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 게시글 파일 버킷 정책
CREATE POLICY "인증된 사용자가 파일을 업로드할 수 있음" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

CREATE POLICY "모든 사용자가 게시글 파일을 볼 수 있음" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

-- 일정 파일 버킷 정책
CREATE POLICY "인증된 사용자가 파일을 업로드할 수 있음" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'events' AND auth.role() = 'authenticated');

CREATE POLICY "모든 사용자가 일정 파일을 볼 수 있음" ON storage.objects
  FOR SELECT USING (bucket_id = 'events');
```

## 🚀 6단계: 실시간 기능 설정

### 6.1 Realtime 활성화
1. **Database** → **Replication** 이동
2. 다음 테이블에 대해 realtime 활성화:
   - `posts`
   - `comments`
   - `events`
   - `notifications`

### 6.2 Edge Functions 설정 (선택사항)
1. **Edge Functions** → **New Function** 클릭
2. 알림 발송, 파일 처리 등 커스텀 로직 구현

## ✅ 7단계: 테스트 및 검증

### 7.1 기본 연결 테스트
1. 프로젝트 재시작: `npm run dev`
2. 브라우저에서 `http://localhost:3000` 접속
3. 개발자 도구에서 오류 확인

### 7.2 인증 기능 테스트
1. 회원가입 시도
2. 로그인/로그아웃 테스트
3. 프로필 수정 테스트

## 🔧 문제 해결

### 일반적인 문제들:
- **환경 변수 오류**: `.env.local` 파일이 프로젝트 루트에 있는지 확인
- **RLS 정책 오류**: 데이터베이스 정책이 올바르게 설정되었는지 확인
- **CORS 오류**: Supabase 프로젝트 설정에서 도메인 허용 확인

### 도움말:
- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Discord 커뮤니티](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## 📋 다음 단계

Supabase 설정이 완료되면 다음 작업을 진행하세요:

1. **인증 시스템 완성**: 로그인/회원가입 폼 구현
2. **게시판 CRUD**: 게시글 작성/수정/삭제 기능
3. **캘린더 기능**: 일정 관리 시스템
4. **알림 시스템**: 실시간 알림 구현
5. **파일 업로드**: 이미지 및 파일 첨부 기능

---

**⚠️ 중요**: 이 가이드를 따라 설정한 후, 실제 프로덕션 환경에서는 보안을 위해 추가적인 설정이 필요할 수 있습니다.

## 🚨 즉시 실행해야 할 작업

### 1단계: .env.local 파일 생성
프로젝트 루트에 `.env.local` 파일을 생성하고 Supabase 프로젝트 정보를 입력하세요.

### 2단계: Supabase 프로젝트 생성
[Supabase](https://supabase.com)에서 새 프로젝트를 생성하세요.

### 3단계: 환경 변수 설정
`.env.local` 파일에 실제 Supabase URL과 API 키를 입력하세요.

### 4단계: 데이터베이스 스키마 적용
SQL 에디터에서 제공된 스키마를 실행하세요.

**이 설정이 완료되면 다음 단계로 진행할 수 있습니다.**
