-- posts 테이블에 attachments 컬럼 추가
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- posts 테이블에 attachments 컬럼 추가
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';

-- 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN posts.attachments IS '첨부파일 URL 배열';

-- 기존 데이터에 대해 빈 배열로 초기화
UPDATE posts 
SET attachments = '{}' 
WHERE attachments IS NULL;

-- 컬럼이 제대로 추가되었는지 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name = 'attachments';
