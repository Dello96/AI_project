-- RLS 정책 상태 확인
-- Supabase SQL Editor에서 실행하세요

-- 1. comments 테이블 RLS 상태 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'comments';

-- 2. comments 테이블의 모든 RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'comments';

-- 3. comments 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'comments' 
ORDER BY ordinal_position;
