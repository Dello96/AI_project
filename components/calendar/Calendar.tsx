'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'

// FullCalendar v6는 CSS import가 필요하지 않음
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarIcon,
  ViewColumnsIcon,
  CalendarDaysIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline'
import { Event, CalendarView, eventCategories } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents'
import { eventService } from '@/lib/database'

interface CalendarProps {
  onAddEvent: () => void
  onSelectEvent: (event: Event) => void
  onSelectDate: (date: Date) => void
}

type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'

export default function Calendar({ onAddEvent, onSelectEvent, onSelectDate }: CalendarProps) {
  const [view, setView] = useState<CalendarViewType>('dayGridMonth')
  const { events, setEvents, isLoading } = useRealtimeEvents()
  const [currentDate, setCurrentDate] = useState(new Date())

  // 실시간 이벤트 사용으로 인해 별도 조회 불필요

  // FullCalendar 이벤트 데이터 변환
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.startDate,
    end: event.endDate,
    allDay: event.isAllDay,
    backgroundColor: eventCategories.find(cat => cat.value === event.category)?.color || '#6b7280',
    borderColor: eventCategories.find(cat => cat.value === event.category)?.color || '#6b7280',
    textColor: 'white',
    extendedProps: {
      description: event.description,
      location: event.location,
      category: event.category,
      authorId: event.authorId
    }
  }))

  // 이벤트 클릭 핸들러
  const handleEventClick = (clickInfo: any) => {
    const event = events.find(e => e.id === clickInfo.event.id)
    if (event) {
      onSelectEvent(event)
    }
  }

  // 날짜 클릭 핸들러
  const handleDateClick = (dateClickInfo: any) => {
    onSelectDate(dateClickInfo.date)
  }

  // 이벤트 드래그 앤 드롭 핸들러
  const handleEventDrop = async (dropInfo: any) => {
    try {
      const event = events.find(e => e.id === dropInfo.event.id)
      if (event) {
        const updatedEvent = {
          ...event,
          startDate: dropInfo.event.start,
          endDate: dropInfo.event.end || dropInfo.event.start
        }
        
        const result = await eventService.updateEvent(event.id, {
          title: updatedEvent.title,
          description: updatedEvent.description || '',
          startDate: updatedEvent.startDate,
          endDate: updatedEvent.endDate,
          location: updatedEvent.location || '',
          category: updatedEvent.category,
          isAllDay: updatedEvent.isAllDay
        })
        
        if (result) {
          // 실시간 업데이트로 자동 반영됨
        }
      }
    } catch (error) {
      console.error('이벤트 업데이트 오류:', error)
      // 드롭 취소
      dropInfo.revert()
    }
  }

  // 이벤트 리사이즈 핸들러
  const handleEventResize = async (resizeInfo: any) => {
    try {
      const event = events.find(e => e.id === resizeInfo.event.id)
      if (event) {
        const updatedEvent = {
          ...event,
          startDate: resizeInfo.event.start,
          endDate: resizeInfo.event.end || resizeInfo.event.start
        }
        
        const result = await eventService.updateEvent(event.id, {
          title: updatedEvent.title,
          description: updatedEvent.description || '',
          startDate: updatedEvent.startDate,
          endDate: updatedEvent.endDate,
          location: updatedEvent.location || '',
          category: updatedEvent.category,
          isAllDay: updatedEvent.isAllDay
        })
        
        if (result) {
          // 실시간 업데이트로 자동 반영됨
        }
      }
    } catch (error) {
      console.error('이벤트 업데이트 오류:', error)
      // 리사이즈 취소
      resizeInfo.revert()
    }
  }

  // 뷰 변경 핸들러
  const handleViewChange = (viewInfo: any) => {
    setView(viewInfo.view.type)
    setCurrentDate(viewInfo.view.currentStart)
  }

  // 네비게이션 핸들러
  const handleNavigation = (navInfo: any) => {
    setCurrentDate(navInfo.view.currentStart)
  }

  // 오늘로 이동
  const goToToday = () => {
    const calendarApi = (document.querySelector('.fc') as any)?.getApi()
    if (calendarApi) {
      calendarApi.today()
    }
  }

  // 이전/다음으로 이동
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const calendarApi = (document.querySelector('.fc') as any)?.getApi()
    if (calendarApi) {
      if (direction === 'prev') {
        calendarApi.prev()
      } else {
        calendarApi.next()
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 헤더 - 극장 스타일 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">일정 관리</h2>
          <p className="text-gray-300 text-lg">청년부 일정을 한눈에 확인하고 관리하세요</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={goToToday} 
            variant="outline" 
            size="lg"
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 px-6 py-3"
          >
            오늘
          </Button>
          <Button 
            onClick={onAddEvent} 
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            일정 추가
          </Button>
        </div>
      </div>

      {/* 캘린더 네비게이션 - 극장 스타일 */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-orange-500/20 shadow-2xl p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* 네비게이션 화살표 */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigateCalendar('prev')}
              variant="ghost"
              size="lg"
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-3"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </Button>
            
            <Button
              onClick={() => navigateCalendar('next')}
              variant="ghost"
              size="lg"
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-3"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </Button>
          </div>
          
          {/* 뷰 선택 버튼 */}
          <div className="flex gap-3">
            <Button
              onClick={() => setView('dayGridMonth')}
              variant={view === 'dayGridMonth' ? 'default' : 'outline'}
              size="lg"
              className={view === 'dayGridMonth' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none px-6 py-3' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 px-6 py-3'
              }
            >
              <CalendarIcon className="w-5 h-5 mr-2" />
              월
            </Button>
            <Button
              onClick={() => setView('timeGridWeek')}
              variant={view === 'timeGridWeek' ? 'default' : 'outline'}
              size="lg"
              className={view === 'timeGridWeek' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none px-6 py-3' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 px-6 py-3'
              }
            >
              <ViewColumnsIcon className="w-5 h-5 mr-2" />
              주
            </Button>
            <Button
              onClick={() => setView('timeGridDay')}
              variant={view === 'timeGridDay' ? 'default' : 'outline'}
              size="lg"
              className={view === 'timeGridDay' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none px-6 py-3' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 px-6 py-3'
              }
            >
              <CalendarDaysIcon className="w-5 h-5 mr-2" />
              일
            </Button>
            <Button
              onClick={() => setView('listWeek')}
              variant={view === 'listWeek' ? 'default' : 'outline'}
              size="lg"
              className={view === 'listWeek' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none px-6 py-3' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 px-6 py-3'
              }
            >
              <ListBulletIcon className="w-5 h-5 mr-2" />
              목록
            </Button>
          </div>
          
          {/* 카테고리 범례 */}
          <div className="flex gap-4">
            {Object.entries(eventCategories).map(([key, category]) => (
              <div key={key} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full shadow-lg"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm text-gray-300 font-medium">{category.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FullCalendar - 극장 스타일 */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-orange-500/20 shadow-2xl p-6">
        <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              headerToolbar={false}
              initialView={view}
              views={{
                dayGridMonth: {
                  titleFormat: { year: 'numeric', month: 'long' }
                },
                timeGridWeek: {
                  titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
                },
                timeGridDay: {
                  titleFormat: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
                },
                listWeek: {
                  titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
                }
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              datesSet={handleNavigation}
              editable={true}
              droppable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              height="auto"
              locale="ko"
              firstDay={1}
              slotMinTime="06:00:00"
              slotMaxTime="24:00:00"
              allDaySlot={true}
              slotDuration="00:30:00"
              slotLabelInterval="01:00:00"
              nowIndicator={true}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                startTime: '09:00',
                endTime: '18:00',
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
                hour12: false
              }}
              dayHeaderFormat={{
                weekday: 'short'
              }}
              buttonText={{
                today: '오늘',
                month: '월',
                week: '주',
                day: '일',
                list: '목록'
              }}
            />
        </div>
      </div>
    </div>
  )
}
