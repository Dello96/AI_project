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
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import LocationSearch from './LocationSearch'

interface EventFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: Partial<Event> | undefined
  selectedDate?: Date | null
}

export default function EventForm({ isOpen, onClose, onSuccess, initialData, selectedDate }: EventFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location: string;
    category: 'worship' | 'meeting' | 'event' | 'smallgroup' | 'vehicle';
    isAllDay: boolean;
    maxAttendees?: number | undefined;
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
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string
    address: string
    lat: number
    lng: number
  } | null>(null)

  useEffect(() => {
            if (initialData) {
          setFormData({
            title: initialData.title || '',
            description: initialData.description || '',
            startDate: initialData.startDate || new Date(),
            endDate: initialData.endDate || new Date(),
            location: initialData.location || '',
            category: (initialData.category as 'worship' | 'meeting' | 'event' | 'smallgroup' | 'vehicle') || 'worship',
            isAllDay: initialData.isAllDay || false,
            ...(initialData.maxAttendees && { maxAttendees: initialData.maxAttendees })
          })
    } else if (selectedDate) {
      // 시간대 문제를 방지하기 위해 로컬 시간으로 날짜 생성
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth()
      const date = selectedDate.getDate()
      
      const startDate = new Date(year, month, date, 9, 0, 0) // 오전 9시로 설정
      const endDate = new Date(year, month, date, 10, 0, 0) // 오전 10시로 설정
      
      setFormData(prev => ({
        ...prev,
        startDate,
        endDate
      }))
    }
  }, [initialData, selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }
    
    const authorId = user.id

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
          category: formData.category as 'worship' | 'meeting' | 'event' | 'smallgroup' | 'vehicle',
          isAllDay: formData.isAllDay
        })

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
          category: formData.category as 'worship' | 'meeting' | 'event' | 'smallgroup' | 'vehicle',
          isAllDay: Boolean(formData.isAllDay),
          authorId: authorId
        }
        
        
        // Supabase에서 현재 세션 가져오기
        const { data: { session } } = await supabase.auth.getSession()
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        
        // 세션이 있으면 Authorization 헤더 추가
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
        
        const response = await fetch('/api/events', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || `서버 오류 (${response.status})`)
        }
        
        if (data.success) {
          result = data.event as Event
          
          // 이벤트 목록 새로고침을 위한 이벤트 발생
          window.dispatchEvent(new CustomEvent('eventCreated', { detail: result }))
          
          // 즉시 onSuccess 호출
          console.log('onSuccess 호출 시작')
          onSuccess()
          console.log('onSuccess 호출 완료')
          
        } else {
          throw new Error(data.error || '이벤트 생성에 실패했습니다.')
        }
      }

      if (!result) {
        setError('일정 저장에 실패했습니다.')
      }
    } catch (error) {
      setError('일정 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    // 시간대 문제를 방지하기 위해 로컬 시간으로 날짜 생성
    const parts = value.split('-')
    if (parts.length !== 3) return
    
    const year = parseInt(parts[0] || '0', 10)
    const month = parseInt(parts[1] || '1', 10)
    const day = parseInt(parts[2] || '1', 10)
    const existingDate = formData[field]
    const newDate = new Date(year, month - 1, day, existingDate.getHours(), existingDate.getMinutes(), 0, 0)
    
    setFormData(prev => ({
      ...prev,
      [field]: newDate
    }))

    // 시작 시간이 종료 시간보다 늦으면 종료 시간 자동 조정
    if (field === 'startDate' && newDate > formData.endDate) {
      const newEndDate = new Date(newDate)
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
    // 로컬 시간대 기준으로 날짜 포맷팅
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatTimeForInput = (date: Date) => {
    // 로컬 시간대 기준으로 시간 포맷팅
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // 위치 선택 핸들러
  const handleLocationSelect = (location: {
    name: string
    address: string
    lat: number
    lng: number
  }) => {
    setSelectedLocation(location)
    setFormData(prev => ({
      ...prev,
      location: location.name
    }))
    setShowLocationSearch(false)
  }

  // 위치 검색 토글
  const toggleLocationSearch = () => {
    setShowLocationSearch(!showLocationSearch)
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
                  category: value as 'worship' | 'meeting' | 'event' | 'smallgroup' | 'vehicle' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {eventCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
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
              <div className="flex items-center justify-between">
                <label htmlFor="location" className="text-sm font-medium text-secondary-700">
                  위치
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleLocationSearch}
                  className="text-xs"
                >
                  {showLocationSearch ? '직접 입력' : '지도에서 검색'}
                </Button>
              </div>
              
              {showLocationSearch ? (
                <LocationSearch
                  onLocationSelect={handleLocationSelect}
                  initialValue={formData.location}
                  placeholder="장소를 검색하세요"
                />
              ) : (
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
              )}
              
              {selectedLocation && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-blue-900">
                        {selectedLocation.name}
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        {selectedLocation.address}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLocation(null)
                        setFormData(prev => ({ ...prev, location: '' }))
                      }}
                      className="text-blue-500 hover:text-blue-700 p-1 h-auto"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 참석 인원 설정 */}
            <div className="space-y-2">
              <label htmlFor="maxAttendees" className="text-sm font-medium text-secondary-700">
                최대 참석 인원 (선택사항)
              </label>
              <Input
                id="maxAttendees"
                type="number"
                min="1"
                value={formData.maxAttendees || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData(prev => ({ 
                    ...prev, 
                    maxAttendees: value ? parseInt(value) : undefined 
                  }))
                }}
                placeholder="참석 가능한 최대 인원을 입력하세요"
              />
              <p className="text-xs text-secondary-500">
                참석 인원을 설정하면 사용자들이 참석 신청을 할 수 있습니다.
              </p>
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
