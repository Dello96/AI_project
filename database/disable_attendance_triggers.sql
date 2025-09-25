-- 참석 인원 카운트 트리거 비활성화
-- API에서 수동으로 참석자 수를 관리하므로 트리거가 중복 실행되지 않도록 함

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS update_event_attendees_count ON event_attendance;

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS update_event_attendees_count();

-- 참석자 수를 수동으로 정확히 계산하는 함수 생성
CREATE OR REPLACE FUNCTION recalculate_event_attendees()
RETURNS void AS $$
BEGIN
  -- 모든 이벤트의 참석자 수를 실제 event_attendance 테이블에서 계산하여 업데이트
  UPDATE events 
  SET current_attendees = (
    SELECT COUNT(*) 
    FROM event_attendance 
    WHERE event_attendance.event_id = events.id
  )
  WHERE id IN (
    SELECT DISTINCT event_id 
    FROM event_attendance
  );
  
  -- 참석자가 없는 이벤트는 0으로 설정
  UPDATE events 
  SET current_attendees = 0 
  WHERE id NOT IN (
    SELECT DISTINCT event_id 
    FROM event_attendance
  );
END;
$$ LANGUAGE plpgsql;

-- 참석자 수 재계산 실행
SELECT recalculate_event_attendees();

-- 결과 확인
SELECT 
  e.id,
  e.title,
  e.current_attendees,
  COUNT(ea.user_id) as actual_count
FROM events e
LEFT JOIN event_attendance ea ON e.id = ea.event_id
GROUP BY e.id, e.title, e.current_attendees
ORDER BY e.created_at DESC;
