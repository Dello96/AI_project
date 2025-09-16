import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Event } from '@/types'

export function useRealtimeEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 이벤트 목록을 다시 가져오는 함수
  const fetchEvents = async () => {
    try {
      console.log('이벤트 목록 새로고침 중...')
      const response = await fetch('/api/events?limit=100')
      const data = await response.json()

      if (data.success && data.data.events) {
        const formattedEvents = data.data.events.map((event: any) => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt)
        }))
        setEvents(formattedEvents)
        console.log('이벤트 목록 업데이트 완료:', formattedEvents.length, '개')
      } else {
        console.error('이벤트 조회 실패:', data.error)
      }
    } catch (error) {
      console.error('이벤트 조회 중 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 초기 이벤트 목록 조회
    fetchEvents()

    // 커스텀 이벤트 리스너 (이벤트 생성 시 목록 새로고침)
    const handleEventCreated = () => {
      console.log('이벤트 생성 감지 - 목록 새로고침')
      fetchEvents()
    }

    window.addEventListener('eventCreated', handleEventCreated)

    // 실시간 구독 설정
    const channel = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('이벤트 변경 감지:', payload)
          
          // 실시간 구독이 작동하지 않을 경우를 대비해 전체 목록을 다시 가져옴
          fetchEvents()
        }
      )
      .subscribe((status) => {
        console.log('실시간 구독 상태:', status)
      })

    // 클린업 함수
    return () => {
      window.removeEventListener('eventCreated', handleEventCreated)
      supabase.removeChannel(channel)
    }
  }, [])

  return { events, setEvents, fetchEvents, isLoading }
}

