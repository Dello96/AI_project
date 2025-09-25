-- Supabase Storage 버킷 생성 및 설정
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. posting-image 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posting-image',
  'posting-image',
  true, -- 공개 버킷
  52428800, -- 50MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 버킷이 제대로 생성되었는지 확인
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets 
WHERE name = 'posting-image';

-- 3. RLS 정책 설정 (모든 사용자가 읽기 가능)
CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'posting-image');

-- 4. 인증된 사용자가 업로드 가능
CREATE POLICY IF NOT EXISTS "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'posting-image' 
  AND auth.role() = 'authenticated'
);

-- 5. 사용자가 자신이 업로드한 파일만 수정/삭제 가능
CREATE POLICY IF NOT EXISTS "Users can update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'posting-image' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'posting-image' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
