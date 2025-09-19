# Supabase에서 좋아요 기능을 위한 컬럼 추가

## 문제 상황
현재 `posts` 테이블에 `liked_by` 컬럼이 없어서 좋아요 기능이 작동하지 않습니다.

## 해결 방법

### 1. Supabase 대시보드 접속
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택

### 2. SQL Editor에서 실행
1. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
2. **"New query"** 클릭
3. 아래 SQL 코드를 복사하여 붙여넣기:

```sql
-- posts 테이블에 liked_by 컬럼 추가
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS liked_by JSONB DEFAULT '[]'::jsonb;

-- 기존 게시글들의 liked_by를 빈 배열로 초기화
UPDATE posts 
SET liked_by = '[]'::jsonb 
WHERE liked_by IS NULL;

-- 컬럼이 제대로 추가되었는지 확인
SELECT id, title, like_count, liked_by 
FROM posts 
LIMIT 3;
```

4. **"Run"** 버튼 클릭하여 실행

### 3. 실행 결과 확인
- `liked_by` 컬럼이 추가되었는지 확인
- 기존 게시글들의 `liked_by`가 `[]`로 초기화되었는지 확인

### 4. 테스트
컬럼 추가 후 다시 좋아요 버튼을 클릭해보세요.

## 대안 방법 (RLS 정책 수정)

만약 `liked_by` 컬럼 추가가 어렵다면, `likes` 테이블의 RLS 정책을 수정할 수도 있습니다:

```sql
-- likes 테이블의 RLS 정책 확인
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
WHERE tablename = 'likes';

-- RLS 정책 삭제 (임시)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON likes;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON likes;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON likes;

-- 새로운 RLS 정책 추가
CREATE POLICY "Enable all operations for authenticated users" ON likes
FOR ALL USING (auth.role() = 'authenticated');

-- 또는 RLS 비활성화 (개발 환경에서만)
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
```

## 권장사항
**`liked_by` 컬럼 추가 방법을 권장**합니다. 이 방법이 더 간단하고 안전합니다.