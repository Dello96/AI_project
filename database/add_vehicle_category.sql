-- 차량사용 카테고리를 event_category ENUM에 추가
-- Supabase SQL Editor에서 실행하세요

-- 기존 ENUM에 'vehicle' 값 추가
ALTER TYPE event_category ADD VALUE 'vehicle';
