-- 익명 사용자도 게시글을 작성할 수 있도록 RLS 정책 수정

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;

-- 새로운 정책 생성 (익명 사용자 허용)
CREATE POLICY "Anyone can create posts" ON posts
  FOR INSERT WITH CHECK (true);

-- author_id를 NULL 허용하도록 컬럼 수정
ALTER TABLE posts ALTER COLUMN author_id DROP NOT NULL;

-- 익명 사용자를 위한 기본 사용자 프로필 생성 (선택사항)
INSERT INTO user_profiles (id, email, name, role, is_approved)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'anonymous@system.local',
  '익명 사용자',
  'member',
  true
) ON CONFLICT (id) DO NOTHING;
