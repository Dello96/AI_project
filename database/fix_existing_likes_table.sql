-- 기존 likes 테이블 수정
-- Supabase SQL Editor에서 실행하세요

-- 기존 likes 테이블에 id 컬럼 추가 (없는 경우)
ALTER TABLE likes ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- 기존 likes 테이블에 created_at 컬럼 추가 (없는 경우)
ALTER TABLE likes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- UNIQUE 제약조건 추가 (중복 좋아요 방지)
ALTER TABLE likes ADD CONSTRAINT IF NOT EXISTS unique_post_like UNIQUE (user_id, post_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- RLS 정책 설정 (없는 경우)
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (없는 경우)
DO $$
BEGIN
    -- 좋아요 조회 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'likes' AND policyname = 'Users can view all likes'
    ) THEN
        CREATE POLICY "Users can view all likes" ON likes
            FOR SELECT USING (true);
    END IF;

    -- 좋아요 생성 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'likes' AND policyname = 'Authenticated users can create likes'
    ) THEN
        CREATE POLICY "Authenticated users can create likes" ON likes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- 좋아요 삭제 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'likes' AND policyname = 'Users can delete their own likes'
    ) THEN
        CREATE POLICY "Users can delete their own likes" ON likes
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
