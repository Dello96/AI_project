'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Event } from '@/types'
import { supabase } from '@/lib/supabase'

interface EventsStore {
  // State
  events: Event[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchEvents: () => Promise<void>
  addEvent: (event: Event) => void
  updateEvent: (event: Event) => void
  deleteEvent: (eventId: string) => void
  setEvents: (events: Event[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  initializeRealtime: () => () => void
}

export const useEventsStore = create<EventsStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    events: [],
    isLoading: true,
    error: null,

    // Actions
    fetchEvents: async () => {
      try {
        set({ isLoading: true, error: null })
        
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
          set({ events: formattedEvents, isLoading: false })
        } else {
          set({ error: '이벤트를 불러올 수 없습니다.', isLoading: false })
        }
      } catch (error: any) {
        console.error('이벤트 조회 오류:', error)
        set({ 
          error: '이벤트를 불러오는 중 오류가 발생했습니다.', 
          isLoading: false 
        })
      }
    },

    addEvent: (event: Event) => {
      set((state) => ({
        events: [...state.events, event]
      }))
    },

    updateEvent: (updatedEvent: Event) => {
      set((state) => ({
        events: state.events.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        )
      }))
    },

    deleteEvent: (eventId: string) => {
      set((state) => ({
        events: state.events.filter(event => event.id !== eventId)
      }))
    },

    setEvents: (events: Event[]) => {
      set({ events })
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error })
    },

    initializeRealtime: () => {
      // 초기 데이터 로드
      get().fetchEvents()

      // 커스텀 이벤트 리스너 (이벤트 생성 시 목록 새로고침)
      const handleEventCreated = () => {
        get().fetchEvents()
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
            get().fetchEvents()
          }
        )
        .subscribe()

      // 클린업 함수
      return () => {
        window.removeEventListener('eventCreated', handleEventCreated)
        supabase.removeChannel(channel)
      }
    }
  }))
)
