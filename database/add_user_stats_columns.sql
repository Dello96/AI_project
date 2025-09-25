-- user_profiles 테이블에 통계 컬럼 추가
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- user_profiles 테이블에 통계 컬럼 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN user_profiles.post_count IS '작성한 게시글 수';
COMMENT ON COLUMN user_profiles.comment_count IS '작성한 댓글 수';
COMMENT ON COLUMN user_profiles.like_count IS '받은 좋아요 수';

-- 기존 사용자들의 통계 초기화
UPDATE user_profiles 
SET 
  post_count = 0,
  comment_count = 0,
  like_count = 0
WHERE post_count IS NULL OR comment_count IS NULL OR like_count IS NULL;

-- 컬럼이 제대로 추가되었는지 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('post_count', 'comment_count', 'like_count');
