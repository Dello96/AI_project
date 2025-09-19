-- 게시글 조회수 증가 함수 생성
CREATE OR REPLACE FUNCTION increment_post_view_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts 
  SET view_count = COALESCE(view_count, 0) + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS 정책 설정 (모든 사용자가 실행 가능)
GRANT EXECUTE ON FUNCTION increment_post_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_post_view_count(UUID) TO anon;

-- 함수가 제대로 생성되었는지 확인
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'increment_post_view_count';
