-- comments 테이블 RLS 완전 비활성화 (개발용)
-- Supabase SQL Editor에서 실행하세요

-- 1. 모든 RLS 정책 삭제
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'comments'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON comments';
    END LOOP;
END $$;

-- 2. RLS 완전 비활성화
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 3. 상태 확인
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'comments';

-- 4. 정책 확인 (비어있어야 함)
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
WHERE tablename = 'comments';
