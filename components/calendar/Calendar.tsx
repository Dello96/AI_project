'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { eventService } from '@/lib/database'

interface CalendarProps {
  onAddEvent: () => void
  onSelectEvent: (event: Event) => void
  onSelectDate: (date: Date) => void
  onDeleteEvent?: (eventId: string) => void
  onRefresh?: () => void
}

type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'

export default function Calendar({ onAddEvent, onSelectEvent, onSelectDate, onDeleteEvent, onRefresh }: CalendarProps) {
  const [view, setView] = useState<CalendarViewType>('dayGridMonth')
  const { events, setEvents, isLoading, deleteEvent, addEvent, updateEvent } = useRealtimeEvents()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['worship', 'meeting', 'event', 'smallgroup', 'vehicle'])
  const calendarRef = useRef<FullCalendar>(null)

  // 실시간 이벤트 사용으로 인해 별도 조회 불필요

  // onDeleteEvent prop이 변경될 때 내부 deleteEvent 함수와 연결
  useEffect(() => {
    if (onDeleteEvent) {
      // onDeleteEvent를 내부 deleteEvent 함수로 래핑
      const wrappedDeleteEvent = (eventId: string) => {
        // UI에서 즉시 제거
        deleteEvent(eventId)
        // 부모 컴포넌트에 알림
        onDeleteEvent(eventId)
      }
      
      // 전역 함수로 등록하여 EventDetail에서 사용할 수 있도록 함
      (window as any).calendarDeleteEvent = wrappedDeleteEvent
    }
    
    // 클린업 함수
    return () => {
      if ((window as any).calendarDeleteEvent) {
        delete (window as any).calendarDeleteEvent
      }
    }
  }, [onDeleteEvent, deleteEvent])

  // 월 선택기 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showMonthPicker && !target.closest('.month-picker')) {
        setShowMonthPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMonthPicker])

  // 카테고리 필터링된 이벤트 데이터 변환
  const filteredEvents = events.filter(event => 
    selectedCategories.includes(event.category)
  )

  const calendarEvents = filteredEvents.map(event => ({
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
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.today()
    }
  }

  // 이전/다음으로 이동
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      if (direction === 'prev') {
        calendarApi.prev()
      } else {
        calendarApi.next()
      }
    }
  }

  // 특정 월로 이동
  const goToMonth = (year: number, month: number) => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.gotoDate(new Date(year, month, 1))
      setShowMonthPicker(false)
    }
  }

  // 현재 표시 중인 년월 가져오기
  const getCurrentYearMonth = () => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      const currentView = calendarApi.view
      return {
        year: currentView.currentStart.getFullYear(),
        month: currentView.currentStart.getMonth()
      }
    }
    return {
      year: new Date().getFullYear(),
      month: new Date().getMonth()
    }
  }

  // 카테고리 토글 함수
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category)
      } else {
        return [...prev, category]
      }
    })
  }

  // 모든 카테고리 선택/해제
  const toggleAllCategories = () => {
    if (selectedCategories.length === eventCategories.length) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(eventCategories.map(cat => cat.value))
    }
  }

  if (isLoading) {
    return (
      <LoadingSpinner 
        message="잠시만 기다려주세요"
        subMessage="일정을 불러오는 중입니다..."
        size="sm"
        className="py-12"
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* 헤더 - 극장 스타일 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">청년부 일정 한 눈에 보기</h2>
          <p className="text-gray-300 text-lg">다가오는 일정을 확인하고 참여하세요!</p>
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
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-orange-500/20 shadow-2xl p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
          {/* 네비게이션 화살표 및 월 선택 */}
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-start">
            <Button
              onClick={() => navigateCalendar('prev')}
              variant="ghost"
              size="sm"
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-2 sm:p-3"
            >
              <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            
            {/* 월 선택 버튼 */}
            <div className="relative month-picker">
              <Button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                variant="outline"
                size="sm"
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 px-3 sm:px-6 py-2 sm:py-3 min-w-[100px] sm:min-w-[120px] text-sm sm:text-base"
              >
                {getCurrentYearMonth().year}년 {getCurrentYearMonth().month + 1}월
              </Button>
              
              {/* 월 선택 드롭다운 */}
              {showMonthPicker && (
                <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-4 min-w-[200px]">
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }, (_, i) => (
                      <Button
                        key={i}
                        onClick={() => goToMonth(getCurrentYearMonth().year, i)}
                        variant="ghost"
                        size="sm"
                        className={`text-gray-300 hover:bg-gray-700 ${
                          i === getCurrentYearMonth().month ? 'bg-orange-500 text-white' : ''
                        }`}
                      >
                        {i + 1}월
                      </Button>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => goToMonth(getCurrentYearMonth().year - 1, getCurrentYearMonth().month)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-300 hover:bg-gray-700"
                      >
                        ← {getCurrentYearMonth().year - 1}
                      </Button>
                      <Button
                        onClick={() => goToMonth(getCurrentYearMonth().year + 1, getCurrentYearMonth().month)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-300 hover:bg-gray-700"
                      >
                        {getCurrentYearMonth().year + 1} →
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              onClick={() => navigateCalendar('next')}
              variant="ghost"
              size="sm"
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-2 sm:p-3"
            >
              <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>
          
          {/* 카테고리 필터 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-300">필터:</span>
                <button
                  onClick={toggleAllCategories}
                  className={`text-xs px-3 py-2 rounded-md border transition-all duration-200 font-medium ${
                    selectedCategories.length === eventCategories.length
                      ? 'bg-orange-500 text-white border-orange-500 shadow-lg transform scale-105'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500 hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: selectedCategories.length === eventCategories.length
                      ? '#f97316'
                      : '#1f2937',
                    borderColor: selectedCategories.length === eventCategories.length
                      ? '#f97316'
                      : '#4b5563',
                    boxShadow: selectedCategories.length === eventCategories.length
                      ? '0 4px 12px rgba(249, 115, 22, 0.3)'
                      : 'none'
                  }}
                >
                  {selectedCategories.length === eventCategories.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <div className="text-xs text-gray-400">
                {filteredEvents.length}개 이벤트 표시 중
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {eventCategories.map((category) => {
                const isSelected = selectedCategories.includes(category.value)
                return (
                  <button
                    key={category.value}
                    onClick={() => toggleCategory(category.value)}
                    className={`text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border transition-all duration-200 flex items-center font-medium ${
                      isSelected
                        ? 'text-white border-orange-500 shadow-lg transform scale-105'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500 hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: isSelected ? '#f97316' : '#1f2937',
                      borderColor: isSelected ? '#f97316' : '#4b5563',
                      boxShadow: isSelected ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none'
                    }}
                  >
                    <div 
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 sm:mr-2 transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-white ring-opacity-50' : ''
                      }`}
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="whitespace-nowrap">{category.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 뷰 선택 버튼 - 모바일 반응형 */}
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-end">
            <Button
              onClick={() => {
                setView('dayGridMonth')
                const calendarApi = calendarRef.current?.getApi()
                if (calendarApi) {
                  calendarApi.changeView('dayGridMonth')
                }
              }}
              variant={view === 'dayGridMonth' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 sm:flex-none min-w-0 sm:min-w-[80px] ${
                view === 'dayGridMonth' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none px-3 py-2 sm:px-6 sm:py-3' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 px-3 py-2 sm:px-6 sm:py-3'
              }`}
            >
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">월</span>
            </Button>
            <Button
              onClick={() => {
                setView('timeGridWeek')
                const calendarApi = calendarRef.current?.getApi()
                if (calendarApi) {
                  calendarApi.changeView('timeGridWeek')
                }
              }}
              variant={view === 'timeGridWeek' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 sm:flex-none min-w-0 sm:min-w-[80px] ${
                view === 'timeGridWeek' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none px-3 py-2 sm:px-6 sm:py-3' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 px-3 py-2 sm:px-6 sm:py-3'
              }`}
            >
              <ViewColumnsIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">주</span>
            </Button>
            <Button
              onClick={() => {
                setView('timeGridDay')
                const calendarApi = calendarRef.current?.getApi()
                if (calendarApi) {
                  calendarApi.changeView('timeGridDay')
                }
              }}
              variant={view === 'timeGridDay' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 sm:flex-none min-w-0 sm:min-w-[80px] ${
                view === 'timeGridDay' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none px-3 py-2 sm:px-6 sm:py-3' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 px-3 py-2 sm:px-6 sm:py-3'
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">일</span>
            </Button>
            <Button
              onClick={() => {
                setView('listWeek')
                const calendarApi = calendarRef.current?.getApi()
                if (calendarApi) {
                  calendarApi.changeView('listWeek')
                }
              }}
              variant={view === 'listWeek' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 sm:flex-none min-w-0 sm:min-w-[80px] ${
                view === 'listWeek' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none px-3 py-2 sm:px-6 sm:py-3' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 px-3 py-2 sm:px-6 sm:py-3'
              }`}
            >
              <ListBulletIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">목록</span>
            </Button>
          </div>
          
        </div>
      </div>

      {/* FullCalendar - 극장 스타일 */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-orange-500/20 shadow-2xl p-6">
        <div className="calendar-container">
            <FullCalendar
              ref={calendarRef}
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
