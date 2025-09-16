'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon, CalendarIcon, ClockIcon, MapPinIcon, TagIcon } from '@heroicons/react/24/outline'
import { Event, eventCategories } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { eventService } from '@/lib/database'
import { notificationService } from '@/lib/notifications'

interface EventFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: Partial<Event> | undefined
  selectedDate?: Date | null
}

export default function EventForm({ isOpen, onClose, onSuccess, initialData, selectedDate }: EventFormProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location: string;
    category: 'worship' | 'meeting' | 'event' | 'smallgroup';
    isAllDay: boolean;
  }>({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    location: '',
    category: 'worship',
    isAllDay: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendNotification, setSendNotification] = useState(true)
  const [reminderMinutes, setReminderMinutes] = useState<number>(30)

  useEffect(() => {
            if (initialData) {
          setFormData({
            title: initialData.title || '',
            description: initialData.description || '',
            startDate: initialData.startDate || new Date(),
            endDate: initialData.endDate || new Date(),
            location: initialData.location || '',
            category: (initialData.category as 'worship' | 'meeting' | 'event' | 'smallgroup') || 'worship',
            isAllDay: initialData.isAllDay || false
          })
    } else if (selectedDate) {
      const startDate = new Date(selectedDate)
      const endDate = new Date(selectedDate)
      endDate.setHours(endDate.getHours() + 1)
      
      setFormData(prev => ({
        ...prev,
        startDate,
        endDate
      }))
    }
  }, [initialData, selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 익명 작성자 ID 생성 (UUID 형식)
    const anonymousAuthorId = '00000000-0000-0000-0000-000000000000'

    try {
      setIsLoading(true)
      setError(null)

      let result: boolean | Event | null = null

      if (initialData?.id) {
        // 일정 수정
        result = await eventService.updateEvent(initialData.id, {
          title: formData.title.trim(),
          description: formData.description?.trim() || '',
          startDate: formData.startDate,
          endDate: formData.endDate,
          location: formData.location?.trim() || '',
          category: formData.category as 'worship' | 'meeting' | 'event' | 'smallgroup',
          isAllDay: formData.isAllDay
        })

        if (result && sendNotification) {
          // 수정 알림 발송
          const { data: users } = await eventService.getEventParticipants(initialData.id)
          if (users) {
            await notificationService.notifyEventUpdated(
              { ...initialData, ...formData } as Event,
              users as any[]
            )
          }
        }
      } else {
        // 새 일정 생성 - API 호출
        // 날짜 유효성 검사 및 변환
        const startDate = formData.startDate instanceof Date ? formData.startDate : new Date(formData.startDate)
        const endDate = formData.endDate instanceof Date ? formData.endDate : new Date(formData.endDate)
        
        // 날짜가 유효한지 확인
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('올바른 날짜를 선택해주세요.')
        }
        
        const requestData = {
          title: formData.title.trim(),
          description: formData.description?.trim() || undefined,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          location: formData.location?.trim() || undefined,
          category: formData.category as 'worship' | 'meeting' | 'event' | 'smallgroup',
          isAllDay: Boolean(formData.isAllDay),
          authorId: anonymousAuthorId
        }
        
        console.log('=== EventForm에서 API 호출 ===')
        console.log('보내는 데이터:', JSON.stringify(requestData, null, 2))
        console.log('각 필드 타입:')
        Object.keys(requestData).forEach(key => {
          console.log(`${key}: ${typeof requestData[key]} = ${JSON.stringify(requestData[key])}`)
        })
        
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        })

        console.log('응답 상태:', response.status, response.statusText)
        const data = await response.json()
        console.log('응답 데이터:', data)
        
        if (!response.ok) {
          console.error('이벤트 생성 API 오류:', data)
          throw new Error(data.error || `서버 오류 (${response.status})`)
        }
        
        if (data.success) {
          result = data.event
          console.log('이벤트 생성 성공:', result)
          
          // 이벤트 목록 새로고침을 위한 이벤트 발생
          window.dispatchEvent(new CustomEvent('eventCreated', { detail: result }))
          
          // 즉시 onSuccess 호출
          console.log('onSuccess 호출 시작')
          onSuccess()
          console.log('onSuccess 호출 완료')
          
          if (result && sendNotification) {
            // 생성 알림 발송
            const { data: users } = await eventService.getEventParticipants(result.id)
            if (users) {
              await notificationService.notifyEventCreated(result, users as any[])
            }

            // 리마인더 스케줄링
            await notificationService.scheduleEventReminder(result, reminderMinutes || 30)
          }
        } else {
          throw new Error(data.error || '이벤트 생성에 실패했습니다.')
        }
      }

      console.log('최종 result 값:', result)
      if (!result) {
        console.log('result가 null이므로 에러 표시')
        setError('일정 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('일정 저장 오류:', error)
      setError('일정 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const date = new Date(value)
    setFormData(prev => ({
      ...prev,
      [field]: date
    }))

    // 시작 시간이 종료 시간보다 늦으면 종료 시간 자동 조정
    if (field === 'startDate' && date > formData.endDate) {
      const newEndDate = new Date(date)
      newEndDate.setHours(newEndDate.getHours() + 1)
      setFormData(prev => ({
        ...prev,
        endDate: newEndDate
      }))
    }
  }

  const handleTimeChange = (field: 'startDate' | 'endDate', value: string) => {
    const [hours, minutes] = value.split(':').map(Number)
    const newDate = new Date(formData[field])
    newDate.setHours(hours || 0, minutes || 0, 0, 0)
    
    setFormData(prev => ({
      ...prev,
      [field]: newDate
    }))
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const formatTimeForInput = (date: Date) => {
    return date.toTimeString().slice(0, 5)
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            {initialData ? '일정 수정' : '새 일정 등록'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-secondary-700">
                일정 제목 *
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="일정 제목을 입력하세요"
                required
              />
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-secondary-700">
                카테고리
              </label>
              <Select
                value={formData.category}
                onValueChange={(value: string) => setFormData(prev => ({ 
                  ...prev, 
                  category: value as 'worship' | 'meeting' | 'event' | 'smallgroup' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventCategories).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 날짜 및 시간 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-sm font-medium text-secondary-700">
                  시작 날짜 *
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <Input
                    id="startDate"
                    type="date"
                    value={formatDateForInput(formData.startDate)}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="endDate" className="text-sm font-medium text-secondary-700">
                  종료 날짜 *
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <Input
                    id="endDate"
                    type="date"
                    value={formatDateForInput(formData.endDate)}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {!formData.isAllDay && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="startTime" className="text-sm font-medium text-secondary-700">
                    시작 시간
                  </label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <Input
                      id="startTime"
                      type="time"
                      value={formatTimeForInput(formData.startDate)}
                      onChange={(e) => handleTimeChange('startDate', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="endTime" className="text-sm font-medium text-secondary-700">
                    종료 시간
                  </label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <Input
                      id="endTime"
                      type="time"
                      value={formatTimeForInput(formData.endDate)}
                      onChange={(e) => handleTimeChange('endDate', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 전체일 체크박스 */}
            <div className="flex items-center space-x-2">
              <input
                id="isAllDay"
                type="checkbox"
                checked={formData.isAllDay}
                onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))}
                className="rounded border-secondary-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isAllDay" className="text-sm font-medium text-secondary-700">
                전체일
              </label>
            </div>

            {/* 위치 */}
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium text-secondary-700">
                위치
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="장소를 입력하세요"
                  className="pl-10"
                />
              </div>
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-secondary-700">
                설명
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="일정에 대한 자세한 설명을 입력하세요"
                rows={3}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            {/* 알림 설정 */}
            <div className="space-y-4 p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <input
                  id="sendNotification"
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="rounded border-secondary-300 text-primary focus:ring-primary"
                />
                <label htmlFor="sendNotification" className="text-sm font-medium text-secondary-700">
                  알림 발송
                </label>
              </div>

              {sendNotification && (
                <div className="space-y-2">
                  <label htmlFor="reminderMinutes" className="text-sm font-medium text-secondary-700">
                    리마인더 시간
                  </label>
                  <Select
                    value={reminderMinutes.toString()}
                    onValueChange={(value: string) => setReminderMinutes(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5분 전</SelectItem>
                      <SelectItem value="15">15분 전</SelectItem>
                      <SelectItem value="30">30분 전</SelectItem>
                      <SelectItem value="60">1시간 전</SelectItem>
                      <SelectItem value="1440">1일 전</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? '저장 중...' : (initialData ? '수정' : '등록')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
