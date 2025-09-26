'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Calendar from '@/components/calendar/Calendar'
import EventForm from '@/components/calendar/EventForm'
import EventDetail from '@/components/calendar/EventDetail'
import { Event } from '@/types'
import { eventService } from '@/lib/database'
export default function CalendarPage() {
  const [view, setView] = useState<'calendar' | 'add' | 'edit' | 'detail'>('calendar')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const handleAddEvent = () => {
    setView('add')
  }

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event)
    // 모달 방식으로 변경 - view 변경하지 않음
  }

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date)
    setView('add')
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setView('edit')
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const result = await eventService.deleteEvent(eventId)
      if (result) {
        setView('calendar')
        setSelectedEvent(null)
        setEditingEvent(null)
        // 성공 메시지 표시
        alert('일정이 성공적으로 삭제되었습니다.')
      }
    } catch (error) {
      console.error('이벤트 삭제 오류:', error)
      alert('일정 삭제에 실패했습니다.')
    }
  }

  const handleEventSuccess = () => {
    setView('calendar')
    setEditingEvent(null)
    setSelectedDate(null)
  }

  const handleBackToCalendar = () => {
    setView('calendar')
    setSelectedEvent(null)
    setEditingEvent(null)
    setSelectedDate(null)
  }

  const handleCloseEventDetail = () => {
    setSelectedEvent(null)
  }

  const handleRefresh = () => {
    // 이벤트 데이터 새로고침 (실시간 구독으로 자동 처리됨)
  }


  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section - 인터파크 극장 스타일 */}
      <section className="relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800" />
        
        <div className="relative z-10 container mx-auto px-6 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            {/* 메인 타이틀 */}
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-orange-500 to-red-500 bg-clip-text text-transparent">
              캘린더
            </h1>
          </motion.div>
        </div>
      </section>

      {/* 캘린더 콘텐츠 */}
      <div className="relative z-10 container mx-auto px-6 pb-16 max-w-7xl">
        <AnimatePresence mode="wait">
          {/* 캘린더는 항상 표시 */}
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Calendar
              onAddEvent={handleAddEvent}
              onSelectEvent={handleSelectEvent}
              onSelectDate={handleSelectDate}
              onDeleteEvent={handleDeleteEvent}
              onRefresh={handleRefresh}
            />
          </motion.div>

        {/* 이벤트 추가/수정 폼 */}
        {view === 'add' && (
          <motion.div
            key="add"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <EventForm
              isOpen={true}
              onClose={handleBackToCalendar}
              onSuccess={handleEventSuccess}
              selectedDate={selectedDate}
            />
          </motion.div>
        )}

        {view === 'edit' && editingEvent && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <EventForm
              isOpen={true}
              onClose={handleBackToCalendar}
              onSuccess={handleEventSuccess}
              initialData={editingEvent}
            />
          </motion.div>
        )}
        </AnimatePresence>

        {/* 이벤트 상세정보 모달 - 오버레이 방식 */}
        {selectedEvent && (
          <EventDetail
            event={selectedEvent}
            isOpen={true}
            onClose={handleCloseEventDetail}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onRefresh={handleRefresh}
          />
        )}
      </div>
    </div>
  )
}
