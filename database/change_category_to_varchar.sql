-- 임시 해결책: post_category를 ENUM에서 VARCHAR로 변경
-- 이 방법은 더 유연하지만 데이터 무결성 검사가 약해집니다.

-- 1. 기존 ENUM 타입을 VARCHAR로 변경
ALTER TABLE posts 
ALTER COLUMN category TYPE VARCHAR(20);

-- 2. CHECK 제약 조건 추가로 유효한 값만 허용
ALTER TABLE posts 
ADD CONSTRAINT check_category_valid 
CHECK (category IN ('notice', 'free', 'qna'));

-- 3. 변경 사항 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts' AND column_name = 'category';

-- 4. 제약 조건 확인
SELECT constraint_name, constraint_type, check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'posts' AND tc.constraint_type = 'CHECK';
