-- posting-image 버킷을 위한 간단한 Supabase Storage RLS 정책
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Allow public read access to posting-image" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to posting-image" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner update access to posting-image" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner delete access to posting-image" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin access to posting-image" ON storage.objects;

-- 2. posting-image 버킷 생성 또는 업데이트
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

-- 3. 간단한 RLS 정책 생성

-- 모든 사용자가 파일을 조회할 수 있음
CREATE POLICY "posting-image-public-read" ON storage.objects
FOR SELECT USING (bucket_id = 'posting-image');

-- 인증된 사용자가 파일을 업로드할 수 있음
CREATE POLICY "posting-image-authenticated-upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'posting-image' 
  AND auth.role() = 'authenticated'
);

-- 파일 소유자가 자신의 파일을 업데이트할 수 있음
CREATE POLICY "posting-image-owner-update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'posting-image' 
  AND auth.uid() = owner
);

-- 파일 소유자가 자신의 파일을 삭제할 수 있음
CREATE POLICY "posting-image-owner-delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'posting-image' 
  AND auth.uid() = owner
);
