-- events 테이블에 location_data 컬럼 추가
-- 장소의 상세 정보(이름, 주소, 위도, 경도)를 JSON 형태로 저장

-- location_data 컬럼 추가
ALTER TABLE events 
ADD COLUMN location_data JSONB;

-- location_data 컬럼에 대한 인덱스 생성 (성능 최적화)
CREATE INDEX idx_events_location_data ON events USING GIN (location_data);

-- location_data 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN events.location_data IS '장소 상세 정보 (이름, 주소, 위도, 경도)를 JSON 형태로 저장';

-- 기존 location 컬럼과의 관계 설명
COMMENT ON COLUMN events.location IS '장소 텍스트 (사용자 입력 또는 location_data.name)';
COMMENT ON COLUMN events.location_data IS '장소 상세 정보 JSON: {name, address, lat, lng}';

-- location_data JSON 구조 예시:
-- {
--   "name": "강남역",
--   "address": "서울특별시 강남구 강남대로 396",
--   "lat": 37.4979,
--   "lng": 127.0276
-- }
