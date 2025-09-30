-- 안전한 RLS 해결 방법
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 정책 모두 삭제
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

-- 2. RLS 재활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 3. 매우 허용적인 정책 생성 (개발용)
-- 이 정책은 인증된 사용자만 허용하지만 RLS 검사를 우회
CREATE POLICY "comments_allow_authenticated" ON comments
    FOR ALL 
    USING (auth.uid() IS NOT NULL) 
    WITH CHECK (auth.uid() IS NOT NULL);

-- 4. 정책 확인
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

-- 5. RLS 상태 확인
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'comments';
