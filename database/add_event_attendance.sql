-- 이벤트 참석 기능을 위한 테이블 및 컬럼 추가

-- 1. events 테이블에 참석 관련 컬럼 추가
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS max_attendees INTEGER,
ADD COLUMN IF NOT EXISTS current_attendees INTEGER DEFAULT 0;

-- 2. event_attendance 테이블 생성 (참석 기록)
CREATE TABLE IF NOT EXISTS event_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- 한 사용자가 같은 이벤트에 중복 참석 방지
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_user_id ON event_attendance(user_id);

-- 4. RLS 정책 설정
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 참석 정보를 조회할 수 있음
CREATE POLICY "Anyone can view attendance" ON event_attendance
  FOR SELECT USING (true);

-- 인증된 사용자만 참석/취소할 수 있음
CREATE POLICY "Authenticated users can manage attendance" ON event_attendance
  FOR ALL USING (auth.uid() = user_id);

-- 5. 기존 이벤트의 current_attendees 초기화
UPDATE events 
SET current_attendees = 0 
WHERE current_attendees IS NULL;

-- 6. 함수 생성: 이벤트 참석자 수 업데이트
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events 
    SET current_attendees = current_attendees + 1 
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events 
    SET current_attendees = GREATEST(0, current_attendees - 1) 
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. 트리거 생성: 참석자 수 자동 업데이트
DROP TRIGGER IF EXISTS trigger_update_attendee_count ON event_attendance;
CREATE TRIGGER trigger_update_attendee_count
  AFTER INSERT OR DELETE ON event_attendance
  FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();
