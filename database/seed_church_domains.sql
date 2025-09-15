-- 교회 도메인 시드 데이터
-- Supabase SQL Editor에서 실행하세요

-- 기존 데이터 삭제 (필요시)
-- DELETE FROM church_domains;

-- 교회 도메인 데이터 삽입
INSERT INTO church_domains (domain, name, description, is_active) VALUES
('gracechurch', '은혜교회', '서울 강남구 소재 청년부', true),
('newlife', '새생명교회', '서울 서초구 소재 청년부', true),
('harvest', '추수교회', '서울 마포구 소재 청년부', true),
('victory', '승리교회', '서울 송파구 소재 청년부', true),
('peace', '평화교회', '서울 영등포구 소재 청년부', true),
('hope', '소망교회', '서울 노원구 소재 청년부', true),
('love', '사랑교회', '서울 강동구 소재 청년부', true),
('faith', '믿음교회', '서울 도봉구 소재 청년부', true),
('joy', '기쁨교회', '서울 중랑구 소재 청년부', true),
('light', '빛교회', '서울 성북구 소재 청년부', true);

-- 데이터 확인
SELECT * FROM church_domains ORDER BY name;
