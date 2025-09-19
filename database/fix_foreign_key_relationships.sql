-- 외래 키 관계 수정 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 외래 키 제약조건 확인 및 삭제
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- posts 테이블의 author_id 외래 키 제약조건 찾기
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'posts'::regclass 
    AND confrelid = 'user_profiles'::regclass
    AND contype = 'f';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE posts DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found between posts and user_profiles';
    END IF;
END $$;

-- 2. 익명 사용자 프로필이 존재하는지 확인하고 없으면 생성
INSERT INTO user_profiles (id, email, name, role, is_approved)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'anonymous@system.local',
    '익명 사용자',
    'user',
    true
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_approved = EXCLUDED.is_approved;

-- 3. posts 테이블의 author_id가 유효한 user_profiles.id를 참조하는지 확인
-- 유효하지 않은 author_id를 익명 사용자 ID로 변경
UPDATE posts 
SET author_id = '00000000-0000-0000-0000-000000000000'
WHERE author_id NOT IN (SELECT id FROM user_profiles);

-- 4. 새로운 외래 키 제약조건 생성
ALTER TABLE posts 
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES user_profiles(id) 
ON DELETE CASCADE;

-- 5. comments 테이블의 author_id도 동일하게 처리
UPDATE comments 
SET author_id = '00000000-0000-0000-0000-000000000000'
WHERE author_id NOT IN (SELECT id FROM user_profiles);

-- 6. comments 테이블의 외래 키 제약조건도 재생성
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- 기존 comments.author_id 외래 키 제약조건 삭제
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'comments'::regclass 
    AND confrelid = 'user_profiles'::regclass
    AND contype = 'f';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE comments DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped comments constraint: %', constraint_name;
    END IF;
END $$;

ALTER TABLE comments 
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES user_profiles(id) 
ON DELETE CASCADE;

-- 7. 결과 확인
SELECT 
    'posts' as table_name,
    COUNT(*) as total_posts,
    COUNT(CASE WHEN author_id = '00000000-0000-0000-0000-000000000000' THEN 1 END) as anonymous_posts
FROM posts
UNION ALL
SELECT 
    'comments' as table_name,
    COUNT(*) as total_comments,
    COUNT(CASE WHEN author_id = '00000000-0000-0000-0000-000000000000' THEN 1 END) as anonymous_comments
FROM comments
UNION ALL
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN id = '00000000-0000-0000-0000-000000000000' THEN 1 END) as anonymous_user
FROM user_profiles;
