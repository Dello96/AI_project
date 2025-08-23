'use client'

import { useState } from 'react'
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
    setView('detail')
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <AnimatePresence mode="wait">
        {view === 'calendar' && (
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
            />
          </motion.div>
        )}

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

        {view === 'detail' && selectedEvent && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <EventDetail
              event={selectedEvent}
              isOpen={true}
              onClose={handleBackToCalendar}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
