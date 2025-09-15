-- 댓글 테이블에 deleted_at 컬럼 추가 (소프트 삭제용)

-- comments 테이블에 deleted_at 컬럼 추가
ALTER TABLE comments ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- 댓글 RLS 정책 수정 (삭제된 댓글 제외)
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;

CREATE POLICY "Anyone can view non-deleted comments" ON comments
  FOR SELECT USING (deleted_at IS NULL);

-- 댓글 수정/삭제 권한 정책 수정
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id AND deleted_at IS NULL);

CREATE POLICY "Users can delete own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id AND deleted_at IS NULL);

-- 관리자 권한 정책 추가
CREATE POLICY "Admins can manage all comments" ON comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
