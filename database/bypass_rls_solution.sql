-- RLS 우회 해결 방법
-- Supabase SQL Editor에서 실행하세요

-- 1. 모든 관련 테이블 RLS 비활성화
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. 모든 RLS 정책 삭제
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename FROM pg_policies 
        WHERE tablename IN ('comments', 'posts', 'user_profiles')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || policy_record.tablename;
    END LOOP;
END $$;

-- 3. 상태 확인
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('comments', 'posts', 'user_profiles');

-- 4. 정책 확인 (모두 비어있어야 함)
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename IN ('comments', 'posts', 'user_profiles');
