-- posts 테이블에 liked_by 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. liked_by 컬럼 추가 (JSONB 타입)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS liked_by JSONB DEFAULT '[]'::jsonb;

-- 2. 기존 게시글들의 liked_by를 빈 배열로 초기화
UPDATE posts 
SET liked_by = '[]'::jsonb 
WHERE liked_by IS NULL;

-- 3. 컬럼이 제대로 추가되었는지 확인
SELECT id, title, like_count, liked_by 
FROM posts 
LIMIT 3;
