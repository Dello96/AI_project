import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Event } from '@/types'

export function useRealtimeEvents() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    // 초기 이벤트 목록 조회
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            user_profiles (
              id,
              name,
              email
            )
          `)
          .order('start_date', { ascending: true })

        if (error) {
          console.error('이벤트 조회 오류:', error)
          return
        }

        if (data) {
          setEvents(data.map(event => ({
            ...event,
            startDate: new Date(event.start_date),
            endDate: new Date(event.end_date),
            authorId: event.created_by,
            author: event.user_profiles,
            createdAt: new Date(event.created_at),
            updatedAt: new Date(event.updated_at)
          })))
        }
      } catch (error) {
        console.error('이벤트 조회 중 오류:', error)
      }
    }

    fetchEvents()

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
          
          if (payload.eventType === 'INSERT') {
            // 새 이벤트 추가
            const newEvent: Event = {
              id: payload.new.id,
              title: payload.new.title,
              description: payload.new.description,
              startDate: new Date(payload.new.start_date),
              endDate: new Date(payload.new.end_date),
              location: payload.new.location,
              category: payload.new.category,
              isAllDay: payload.new.all_day,
              authorId: payload.new.created_by,
              createdAt: new Date(payload.new.created_at),
              updatedAt: new Date(payload.new.updated_at)
            }
            setEvents(prev => [...prev, newEvent])
          } else if (payload.eventType === 'UPDATE') {
            // 이벤트 수정
            const updatedEvent: Event = {
              id: payload.new.id,
              title: payload.new.title,
              description: payload.new.description,
              startDate: new Date(payload.new.start_date),
              endDate: new Date(payload.new.end_date),
              location: payload.new.location,
              category: payload.new.category,
              isAllDay: payload.new.all_day,
              authorId: payload.new.created_by,
              createdAt: new Date(payload.new.created_at),
              updatedAt: new Date(payload.new.updated_at)
            }
            setEvents(prev => 
              prev.map(event => 
                event.id === updatedEvent.id ? updatedEvent : event
              )
            )
          } else if (payload.eventType === 'DELETE') {
            // 이벤트 삭제
            setEvents(prev => 
              prev.filter(event => event.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // 클린업 함수
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { events, setEvents }
}

