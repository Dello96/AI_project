'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  UserPlusIcon, 
  UserMinusIcon, 
  QuestionMarkCircleIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface AttendanceButtonProps {
  eventId: string
  maxAttendees?: number
  attendeeCount?: number
  requiresAttendance?: boolean
  onAttendanceChange?: (count: number) => void
}

type AttendanceStatus = 'attending' | 'not_attending' | 'maybe' | null

export default function AttendanceButton({ 
  eventId, 
  maxAttendees, 
  attendeeCount = 0, 
  requiresAttendance = false,
  onAttendanceChange 
}: AttendanceButtonProps) {
  const [currentStatus, setCurrentStatus] = useState<AttendanceStatus | 'attending'>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 참석 상태 조회
  useEffect(() => {
    if (!requiresAttendance) return
    
    const fetchAttendanceStatus = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/attendance`)
        const data = await response.json()
        
        if (data.success) {
          // 현재 사용자의 참석 상태 확인 (임시로 null로 설정)
          // 실제로는 사용자 인증 후 사용자 ID로 확인
          setCurrentStatus(null)
        }
      } catch (err) {
        console.error('참석 상태 조회 오류:', err)
      }
    }

    fetchAttendanceStatus()
  }, [eventId, requiresAttendance])

  const handleAttendanceChange = async (status: AttendanceStatus) => {
    if (!requiresAttendance) return
    
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${eventId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          userId: '00000000-0000-0000-0000-000000000000' // 임시 사용자 ID
        })
      })

      const data = await response.json()

      if (data.success) {
        setCurrentStatus(status)
        onAttendanceChange?.(data.data?.counts?.attending || 0)
      } else {
        setError(data.error || '참석 상태 업데이트에 실패했습니다.')
      }
    } catch (err) {
      console.error('참석 상태 업데이트 오류:', err)
      setError('참석 상태 업데이트 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!requiresAttendance) {
    return null
  }

  const isFull = maxAttendees && attendeeCount >= maxAttendees
  const canAttend = !isFull || currentStatus === 'attending'

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* 참석 인원 표시 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UsersIcon className="w-5 h-5 text-autumn-coral" />
              <span className="text-sm font-medium text-gray-700">
                참석 인원: {attendeeCount}명
                {maxAttendees && ` / ${maxAttendees}명`}
              </span>
            </div>
            {isFull && (
              <span className="text-xs text-red-600 font-medium">
                정원 마감
              </span>
            )}
          </div>

          {/* 참석 버튼들 */}
          <div className="flex space-x-2">
            <Button
              variant={currentStatus === 'attending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAttendanceChange('attending')}
              disabled={isLoading || (!canAttend && (currentStatus as string) !== 'attending')}
              className={`flex-1 ${
                currentStatus === 'attending' 
                  ? 'bg-autumn-coral text-white' 
                  : 'border-autumn-coral text-autumn-coral hover:bg-autumn-coral hover:text-white'
              }`}
            >
              <UserPlusIcon className="w-4 h-4 mr-1" />
              참석
            </Button>

            <Button
              variant={currentStatus === 'maybe' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAttendanceChange('maybe')}
              disabled={isLoading}
              className={`flex-1 ${
                currentStatus === 'maybe' 
                  ? 'bg-autumn-gold text-white' 
                  : 'border-autumn-gold text-autumn-gold hover:bg-autumn-gold hover:text-white'
              }`}
            >
              <QuestionMarkCircleIcon className="w-4 h-4 mr-1" />
              검토중
            </Button>

            <Button
              variant={currentStatus === 'not_attending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAttendanceChange('not_attending')}
              disabled={isLoading}
              className={`flex-1 ${
                currentStatus === 'not_attending' 
                  ? 'bg-gray-500 text-white' 
                  : 'border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white'
              }`}
            >
              <UserMinusIcon className="w-4 h-4 mr-1" />
              불참
            </Button>
          </div>

          {/* 현재 상태 표시 */}
          {currentStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <span className="text-sm text-gray-600">
                현재 상태: {
                  currentStatus === 'attending' ? '참석' :
                  currentStatus === 'maybe' ? '검토중' :
                  currentStatus === 'not_attending' ? '불참' : ''
                }
              </span>
            </motion.div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
