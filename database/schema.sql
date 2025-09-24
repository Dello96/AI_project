-- 청년부 커뮤니티 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 교회 도메인 테이블 제거됨 (단순화)

-- 2. 임시 회원가입 요청 테이블
CREATE TABLE pending_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  church_domain_id UUID, -- 교회 도메인 참조 제거
  hashed_password VARCHAR(255) NOT NULL,
  status pending_status DEFAULT 'pending',
  rejection_reason TEXT,
  rejection_notes TEXT,
  approved_by UUID,
  rejected_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 임시 회원가입 상태 ENUM
CREATE TYPE pending_status AS ENUM ('pending', 'approved', 'rejected');

-- 4. 사용자 프로필 테이블 (Supabase Auth와 연동)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES user_profiles(id),
  church_domain_id UUID, -- 교회 도메인 참조 제거
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 사용자 역할 ENUM
CREATE TYPE user_role AS ENUM ('user', 'leader', 'admin');

-- 4. 게시글 테이블
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  category post_category NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  attachments TEXT[], -- 파일 첨부 URL 배열
  deleted_at TIMESTAMP WITH TIME ZONE, -- 소프트 삭제
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 게시글 카테고리 ENUM
CREATE TYPE post_category AS ENUM ('notice', 'free', 'qna');

-- 5-1. 익명 사용자 프로필 생성 (게시글 작성용)
INSERT INTO user_profiles (id, email, name, role, is_approved, church_domain_id)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'anonymous@system.local',
  '익명 사용자',
  'member',
  true,
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (id) DO NOTHING;

-- 6. 댓글 테이블
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 이벤트 테이블
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location VARCHAR(255),
  category event_category NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 이벤트 카테고리 ENUM
CREATE TYPE event_category AS ENUM ('worship', 'meeting', 'event', 'smallgroup', 'vehicle');

-- 9. 좋아요 테이블
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- 10. 리프레시 토큰 테이블
CREATE TABLE refresh_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 인증 감사 로그 테이블
CREATE TABLE auth_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  action auth_action_type NOT NULL,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. 인증 액션 타입 ENUM
CREATE TYPE auth_action_type AS ENUM (
  'login_success',
  'login_failure', 
  'logout',
  'token_refresh',
  'password_change',
  'account_locked'
);

-- 13. 알림 테이블
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_id UUID, -- 게시글, 댓글, 이벤트 등의 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 알림 타입 ENUM
CREATE TYPE notification_type AS ENUM ('post', 'comment', 'event', 'system');

-- 12. 파일 업로드 테이블
CREATE TABLE file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  url TEXT NOT NULL,
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_pending_members_email ON pending_members(email);
CREATE INDEX idx_pending_members_status ON pending_members(status);
CREATE INDEX idx_pending_members_created_at ON pending_members(created_at DESC);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_deleted_at ON posts(deleted_at);
CREATE INDEX idx_posts_category_created_at ON posts(category, created_at DESC);
CREATE INDEX idx_posts_author_created_at ON posts(author_id, created_at DESC);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE pending_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- 임시 회원가입 요청 RLS 정책
CREATE POLICY "Anyone can create pending member requests" ON pending_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can view pending members" ON pending_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update pending members" ON pending_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 사용자 프로필 RLS 정책
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 게시글 RLS 정책
CREATE POLICY "Anyone can view non-deleted posts" ON posts
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id AND deleted_at IS NULL);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all posts" ON posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 댓글 RLS 정책
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- 이벤트 RLS 정책
CREATE POLICY "Anyone can view events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own events" ON events
  FOR DELETE USING (auth.uid() = created_by);

-- 좋아요 RLS 정책
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- 알림 RLS 정책
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 파일 업로드 RLS 정책
CREATE POLICY "Anyone can view file uploads" ON file_uploads
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload files" ON file_uploads
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own uploads" ON file_uploads
  FOR DELETE USING (auth.uid() = uploaded_by);

-- 함수 및 트리거 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 좋아요 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_post_like_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- 댓글 좋아요 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comment_like_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- 조회수 자동 증가 함수
CREATE OR REPLACE FUNCTION increment_post_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = NEW.id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 관리자 관련 테이블 및 ENUM 추가

-- 관리자 액션 타입 ENUM
CREATE TYPE admin_action_type AS ENUM (
  'user_approve',
  'user_reject',
  'user_suspend',
  'user_activate',
  'report_review',
  'report_resolve',
  'content_moderate',
  'role_change'
);

-- 대상 엔티티 타입 ENUM
CREATE TYPE target_entity_type AS ENUM (
  'user',
  'post',
  'comment',
  'event',
  'report'
);

-- 신고 사유 ENUM
CREATE TYPE report_reason AS ENUM (
  'spam',
  'inappropriate_content',
  'harassment',
  'fake_news',
  'copyright_violation',
  'other'
);

-- 신고 상태 ENUM
CREATE TYPE report_status AS ENUM (
  'pending',
  'under_review',
  'resolved',
  'dismissed'
);

-- 관리자 감사 로그 테이블
CREATE TABLE admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  action admin_action_type NOT NULL,
  target_type target_entity_type NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 신고 테이블
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  target_type target_entity_type NOT NULL,
  target_id UUID NOT NULL,
  reason report_reason NOT NULL,
  description TEXT,
  status report_status DEFAULT 'pending',
  assigned_admin_id UUID REFERENCES user_profiles(id),
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 감사 로그 RLS 정책
CREATE POLICY "Admins can view all audit logs" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create audit logs" ON admin_audit_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 신고 RLS 정책
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 초기 데이터 삽입
INSERT INTO church_domains (domain, name, description) VALUES
  ('youth.church.kr', '청년부 교회', '청년부를 위한 커뮤니티'),
  ('ministry.kr', '사역자 교회', '사역자를 위한 커뮤니티'),
  ('gospel.kr', '복음 교회', '복음을 위한 커뮤니티');
