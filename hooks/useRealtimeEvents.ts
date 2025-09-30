import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Event } from '@/types'

export function useRealtimeEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 이벤트 목록을 다시 가져오는 함수
  const fetchEvents = async () => {
    try {
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
      }
    } catch (error) {
      // 이벤트 조회 실패 시 기존 데이터 유지
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 초기 이벤트 목록 조회
    fetchEvents()

    // 커스텀 이벤트 리스너 (이벤트 생성 시 목록 새로고침)
    const handleEventCreated = () => {
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
          // 실시간 구독이 작동하지 않을 경우를 대비해 전체 목록을 다시 가져옴
          fetchEvents()
        }
      )
      .subscribe()

    // 클린업 함수
    return () => {
      window.removeEventListener('eventCreated', handleEventCreated)
      supabase.removeChannel(channel)
    }
  }, [])

  // 이벤트 즉시 삭제 함수 (UI 반응성 향상)
  const deleteEvent = (eventId: string) => {
    setEvents(prevEvents => {
      const filteredEvents = prevEvents.filter(event => event.id !== eventId)
      return filteredEvents
    })
  }

  // 이벤트 즉시 추가 함수 (UI 반응성 향상)
  const addEvent = (newEvent: Event) => {
    setEvents(prevEvents => [...prevEvents, newEvent])
  }

  // 이벤트 즉시 업데이트 함수 (UI 반응성 향상)
  const updateEvent = (updatedEvent: Event) => {
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    )
  }

  return { 
    events, 
    setEvents, 
    fetchEvents, 
    deleteEvent,
    addEvent,
    updateEvent,
    isLoading 
  }
}

