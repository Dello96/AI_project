-- RLS 정책 수정 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON posts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON posts;
DROP POLICY IF EXISTS "Enable update for users based on author_id" ON posts;
DROP POLICY IF EXISTS "Enable delete for users based on author_id" ON posts;

DROP POLICY IF EXISTS "Enable read access for all users" ON comments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON comments;
DROP POLICY IF EXISTS "Enable update for users based on author_id" ON comments;
DROP POLICY IF EXISTS "Enable delete for users based on author_id" ON comments;

-- 2. posts 테이블 RLS 정책 재생성
CREATE POLICY "Enable read access for all users" ON posts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on author_id" ON posts
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for users based on author_id" ON posts
    FOR DELETE USING (true);

-- 3. comments 테이블 RLS 정책 재생성
CREATE POLICY "Enable read access for all users" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on author_id" ON comments
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for users based on author_id" ON comments
    FOR DELETE USING (true);

-- 4. user_profiles 테이블 RLS 정책 확인 및 수정
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;

CREATE POLICY "Enable read access for all users" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON user_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on id" ON user_profiles
    FOR UPDATE USING (true);

-- 5. RLS 활성화 확인
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
