'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  XMarkIcon, 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Event, eventCategories } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { eventService } from '@/lib/database'

interface EventDetailProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  onEdit: (event: Event) => void
  onDelete: (eventId: string) => void
}

export default function EventDetail({ event, isOpen, onClose, onEdit, onDelete }: EventDetailProps) {
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // 작성자 권한 확인
  const canEditOrDelete = user && event.authorId === user.id
  
  // 디버깅을 위한 로그
  console.log('EventDetail 디버깅:', {
    user: user ? { id: user.id, email: user.email } : null,
    event: {
      id: event.id,
      title: event.title,
      authorId: event.authorId,
      author: event.author
    },
    canEditOrDelete
  })

  const handleEdit = () => {
    setIsEditing(true)
    onEdit(event)
    // 수정 폼이 열리면 모달을 닫음
    setTimeout(() => {
      onClose()
    }, 100)
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `"${event.title}" 일정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    )
    
    if (!confirmed) return

    try {
      setIsDeleting(true)
      const result = await eventService.deleteEvent(event.id)
      if (result) {
        onDelete(event.id)
        onClose()
        // 성공 메시지 표시
        alert('일정이 성공적으로 삭제되었습니다.')
      }
    } catch (error) {
      console.error('이벤트 삭제 오류:', error)
      alert('일정 삭제에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsDeleting(false)
    }
  }

  const categoryInfo = eventCategories.find(cat => cat.value === event.category)
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <CardContent className="p-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryInfo?.color} text-white`}>
                  {categoryInfo?.label}
                </span>
                <h2 className="text-2xl font-bold text-secondary-900">{event.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 일정 정보 */}
            <div className="space-y-4 mb-6">
              {/* 날짜 및 시간 */}
              <div className="flex items-start gap-3">
                <CalendarIcon className="w-5 h-5 text-secondary-400 mt-0.5" />
                <div>
                  <p className="text-sm text-secondary-600">날짜 및 시간</p>
                  <p className="text-secondary-900">
                    {formatDateTime(event.startDate)}
                    {!event.isAllDay && (
                      <>
                        <br />
                        ~ {formatDateTime(event.endDate)}
                      </>
                    )}
                    {event.isAllDay && <span className="text-secondary-500"> (종일)</span>}
                  </p>
                </div>
              </div>

              {/* 장소 */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-secondary-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-secondary-600">장소</p>
                    <p className="text-secondary-900">{event.location}</p>
                  </div>
                </div>
              )}

              {/* 설명 */}
              {event.description && (
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="text-sm text-secondary-600">설명</p>
                    <p className="text-secondary-900 whitespace-pre-wrap">{event.description}</p>
                  </div>
                </div>
              )}

              {/* 작성자 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="text-sm text-secondary-600">작성자</p>
                  <p className="text-secondary-900">{event.author?.name || '알 수 없음'}</p>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            {user && (user.id === event.authorId || user.role === 'admin') ? (
              <div className="flex gap-3 justify-end pt-4 border-t border-secondary-200">
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  disabled={isEditing}
                  className="flex items-center gap-2 border-autumn-coral text-autumn-coral hover:bg-autumn-coral hover:text-white transition-all duration-200 disabled:opacity-50"
                >
                  <PencilIcon className="w-4 h-4" />
                  {isEditing ? '수정 중...' : '수정'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  loading={isDeleting}
                  disabled={isDeleting}
                  className="flex items-center gap-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  {isDeleting ? '삭제 중...' : '삭제'}
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t border-secondary-200">
                <p className="text-sm text-secondary-500 text-center">
                  {!user ? '로그인하면 일정을 수정하거나 삭제할 수 있습니다.' : '본인이 작성한 일정만 수정하거나 삭제할 수 있습니다.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
