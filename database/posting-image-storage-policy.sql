-- posting-image 버킷을 위한 Supabase Storage RLS 정책
-- Supabase SQL Editor에서 실행하세요

-- posting-image 버킷에 대한 RLS 활성화
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posting-image',
  'posting-image', 
  true, -- public 버킷
  10485760, -- 10MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- posting-image 버킷에 대한 RLS 정책 생성

-- 1. 모든 사용자가 파일을 조회할 수 있음 (public 버킷)
CREATE POLICY "Anyone can view posting images" ON storage.objects
FOR SELECT USING (bucket_id = 'posting-image');

-- 2. 인증된 사용자가 파일을 업로드할 수 있음
CREATE POLICY "Authenticated users can upload posting images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'posting-image' 
  AND auth.role() = 'authenticated'
);

-- 3. 파일 업로드자가 자신의 파일을 업데이트할 수 있음
CREATE POLICY "Users can update own posting images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'posting-image' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. 파일 업로드자가 자신의 파일을 삭제할 수 있음
CREATE POLICY "Users can delete own posting images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'posting-image' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. 관리자는 모든 파일을 관리할 수 있음
CREATE POLICY "Admins can manage all posting images" ON storage.objects
FOR ALL USING (
  bucket_id = 'posting-image' 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
