-- comments 테이블 RLS 완전 재설정
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

-- 3. RLS 재활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 4. 매우 허용적인 정책 생성 (개발용)
CREATE POLICY "comments_allow_all_operations" ON comments
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 5. 정책 확인
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

-- 6. RLS 상태 확인
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'comments';
