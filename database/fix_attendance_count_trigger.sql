-- 참석 인원 카운트 자동 관리 트리거 수정
-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS event_attendance_insert_trigger ON event_attendance;
DROP TRIGGER IF EXISTS event_attendance_delete_trigger ON event_attendance;
DROP FUNCTION IF EXISTS update_event_attendees_count();

-- 새로운 함수 생성 - 실제 참석자 수를 정확히 계산
CREATE OR REPLACE FUNCTION update_event_attendees_count()
RETURNS TRIGGER AS $$
BEGIN
    -- 이벤트의 현재 참석자 수를 실제 event_attendance 테이블에서 계산
    UPDATE public.events
    SET current_attendees = (
        SELECT COUNT(*)
        FROM public.event_attendance
        WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
    )
    WHERE id = COALESCE(NEW.event_id, OLD.event_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- INSERT 트리거 재생성
CREATE TRIGGER event_attendance_insert_trigger
    AFTER INSERT ON event_attendance
    FOR EACH ROW EXECUTE FUNCTION update_event_attendees_count();

-- DELETE 트리거 재생성
CREATE TRIGGER event_attendance_delete_trigger
    AFTER DELETE ON event_attendance
    FOR EACH ROW EXECUTE FUNCTION update_event_attendees_count();

-- 기존 데이터 정정 - 모든 이벤트의 참석자 수를 실제 데이터로 업데이트
UPDATE public.events
SET current_attendees = (
    SELECT COUNT(*)
    FROM public.event_attendance
    WHERE event_id = events.id
);
