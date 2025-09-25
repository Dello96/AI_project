-- post_category ENUM에 'qna' 값 추가
-- PostgreSQL에서 ENUM에 새로운 값을 추가하는 방법

-- 1. 기존 ENUM에 'qna' 값 추가
ALTER TYPE post_category ADD VALUE 'qna';

-- 2. ENUM 값이 제대로 추가되었는지 확인
SELECT unnest(enum_range(NULL::post_category)) as category_values;

-- 3. 기존 게시글들의 카테고리 확인
SELECT category, COUNT(*) as count
FROM posts
GROUP BY category
ORDER BY category;

-- 4. posts 테이블의 category 컬럼이 올바른 ENUM 타입을 사용하는지 확인
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'posts' AND column_name = 'category';
