'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  XMarkIcon, 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import { Event, eventCategories } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { eventService } from '@/lib/database'
import { 
  generateKakaoMapUrl, 
  generateKakaoMapDirectionsUrl, 
  isValidLocationData,
  startKakaoNavi,
  shareKakaoNavi
} from '@/utils/kakaoMapUtils'
import { 
  startKakaoNaviWithSDK, 
  shareKakaoNaviWithSDK,
  startKakaoNaviByPlaceName
} from '@/utils/kakaoNaviSDK'

interface EventDetailProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  onEdit: (event: Event) => void
  onDelete: (eventId: string) => void
  onRefresh?: () => void
}

export default function EventDetail({ event, isOpen, onClose, onEdit, onDelete, onRefresh }: EventDetailProps) {
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isAttending, setIsAttending] = useState(event.userAttending || false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentAttendees, setCurrentAttendees] = useState(event.currentAttendees || 0)
  const [isInitialized, setIsInitialized] = useState(false)

  // 작성자 권한 확인
  const canEditOrDelete = user && event.authorId === user.id
  
  // 초기 참석 상태 확인
  useEffect(() => {
    const checkAttendanceStatus = async () => {
      if (!user || !isOpen || isInitialized) return
      
      try {
        const response = await fetch(`/api/events/${event.id}/attendance?userId=${user.id}`)
        const data = await response.json()
        
        if (response.ok) {
          setIsAttending(data.attending || false)
          // API에서 받은 실제 참석 인원 수로 업데이트
          if (data.currentAttendees !== undefined) {
            setCurrentAttendees(data.currentAttendees)
          }
        }
      } catch (error) {
        // 참석 상태 확인 실패 시 기본값 유지
      } finally {
        setIsInitialized(true)
      }
    }
    
    checkAttendanceStatus()
  }, [user, event.id, isOpen, isInitialized])

  // 웹 기반 카카오 내비 기능은 즉시 사용 가능하므로 별도 로드 확인 불필요

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
      
      // 먼저 UI에서 즉시 제거 (사용자 경험 향상)
      onDelete(event.id)
      onClose()
      
      // 백그라운드에서 실제 삭제 처리
      const result = await eventService.deleteEvent(event.id)
      if (!result) {
        // 삭제 실패 시 다시 추가 (롤백)
        alert('일정 삭제에 실패했습니다. 다시 시도해주세요.')
      } else {
        // 성공 메시지 표시
        alert('일정이 성공적으로 삭제되었습니다.')
      }
    } catch (error) {
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

  // 참석/취소 처리
  const handleAttendance = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    // 중복 클릭 방지
    if (isLoading) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${event.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (data.success) {
        const wasAttending = isAttending
        const newAttending = data.attending
        
        setIsAttending(newAttending)
        
        // API에서 받은 실제 참석 인원 수로 업데이트
        if (data.currentAttendees !== undefined) {
          setCurrentAttendees(data.currentAttendees)
        } else {
          // 참석 상태가 변경된 경우에만 인원 수 조정 (폴백)
          if (wasAttending !== newAttending) {
            setCurrentAttendees(prev => newAttending ? prev + 1 : prev - 1)
          }
        }
        
        // 이벤트 데이터 새로고침
        onRefresh?.()
        
        alert(data.message)
      } else {
        alert(data.error || '참석 처리에 실패했습니다.')
      }
    } catch (error) {
      alert('참석 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
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
                  <div className="flex-1">
                    <p className="text-sm text-secondary-600">장소</p>
                    <p className="text-secondary-900">{event.location}</p>
                    
                    
          {/* 카카오맵 및 카카오 내비 연결 버튼들 */}
          <div className="flex flex-wrap gap-2 mt-2">
            {isValidLocationData(event.locationData) ? (
              // locationData가 있는 경우 - 정확한 위치로 연결
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const mapUrl = generateKakaoMapUrl(event.locationData!, {
                      zoom: 3,
                      showMarker: true,
                      showLabel: true
                    });
                    window.open(mapUrl, '_blank');
                  }}
                  className="flex items-center gap-1 text-xs"
                >
                  <MapPinIcon className="w-3 h-3" />
                  지도 보기
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      // 정확한 좌표가 있는 경우 SDK 사용
                      const success = await startKakaoNaviWithSDK(
                        event.locationData!.name,
                        event.locationData!.lng,
                        event.locationData!.lat,
                        {
                          coordType: 'wgs84',
                          vehicleType: 1, // 승용차
                          rpOption: 100,  // 추천 경로
                          routeInfo: false
                        }
                      );
                      
                      if (!success) {
                        // SDK 실패 시 기존 방식으로 폴백
                        startKakaoNavi(event.locationData!, {
                          vehicleType: '1',
                          rpOption: '1',
                          routeInfo: true
                        });
                      }
                    } catch (error) {
                      console.error('카카오내비 길안내 오류:', error);
                      // 오류 발생 시 기존 방식으로 폴백
                      startKakaoNavi(event.locationData!, {
                        vehicleType: '1',
                        rpOption: '1',
                        routeInfo: true
                      });
                    }
                  }}
                  className="flex items-center gap-1 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                  길찾기
                </Button>
                {isValidLocationData(event.locationData) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        // 정확한 좌표가 있는 경우 SDK 사용
                        const success = await shareKakaoNaviWithSDK(
                          event.locationData!.name,
                          event.locationData!.lng,
                          event.locationData!.lat,
                          'wgs84'
                        );
                        
                        if (!success) {
                          // SDK 실패 시 기존 방식으로 폴백
                          shareKakaoNavi(event.locationData!);
                        }
                      } catch (error) {
                        console.error('카카오내비 목적지 공유 오류:', error);
                        // 오류 발생 시 기존 방식으로 폴백
                        shareKakaoNavi(event.locationData!);
                      }
                    }}
                    className="flex items-center gap-1 text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                  >
                    <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                    목적지 공유
                  </Button>
                )}
              </>
            ) : (
              // locationData가 없는 경우 - 장소명으로 검색
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (event.location) {
                      const searchUrl = `https://map.kakao.com/link/search/${encodeURIComponent(event.location)}`;
                      window.open(searchUrl, '_blank');
                    }
                  }}
                  className="flex items-center gap-1 text-xs"
                  disabled={!event.location}
                >
                  <MapPinIcon className="w-3 h-3" />
                  지도에서 검색
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (event.location) {
                      try {
                        // 장소명으로 카카오내비 SDK 시도
                        const success = await startKakaoNaviByPlaceName(event.location, {
                          vehicleType: 1, // 승용차
                          rpOption: 100,  // 추천 경로
                          routeInfo: false
                        });
                        
                        if (!success) {
                          // SDK 실패 시 카카오내비 앱으로만 폴백 (가장 기본적인 형식)
                          const appUrl = `kakaonavi://navigate?name=${encodeURIComponent(event.location)}&x=127.100823924714&y=37.5179242320345`;
                          console.log('🔍 이벤트 상세 - 카카오내비 길찾기 URL:', appUrl);
                          console.log('📍 이벤트 위치 정보:', {
                            location: event.location,
                            x: 127.100823924714,
                            y: 37.5179242320345
                          });
                          window.location.href = appUrl;
                        }
                      } catch (error) {
                        console.error('카카오 내비 길찾기 오류:', error);
                        // 오류 발생 시에도 카카오내비 앱으로만 시도 (가장 기본적인 형식)
                        const appUrl = `kakaonavi://navigate?name=${encodeURIComponent(event.location)}&x=127.100823924714&y=37.5179242320345`;
                        console.log('🔍 이벤트 상세 - 오류 시 카카오내비 길찾기 URL:', appUrl);
                        window.location.href = appUrl;
                      }
                    }
                  }}
                  className="flex items-center gap-1 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  disabled={!event.location}
                >
                  <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                  길찾기
                </Button>
                {event.location && (
                  <div className="text-xs text-gray-500 mt-1">
                    카카오 내비 기능을 사용하려면 정확한 위치 정보가 필요합니다.
                  </div>
                )}
              </>
            )}
          </div>
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

              {/* 참석 정보 - 모임, 행사, 소그룹, 차량이용 카테고리에서만 표시 */}
              {(['meeting', 'event', 'smallgroup', 'vehicle'].includes(event.category)) && (
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-secondary-600">참석 인원</p>
                    <div className="flex items-center gap-2">
                      <p className="text-secondary-900 font-medium">
                        {event.maxAttendees 
                          ? `${currentAttendees}명 / ${event.maxAttendees}명`
                          : `${currentAttendees}명`
                        }
                      </p>
                      {event.maxAttendees && (
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min((currentAttendees / event.maxAttendees) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                    {event.maxAttendees && (
                      <p className="text-xs text-secondary-500 mt-1">
                        {currentAttendees >= event.maxAttendees 
                          ? '참석 인원이 가득 찼습니다' 
                          : `${event.maxAttendees - currentAttendees}명 더 참석 가능`
                        }
                      </p>
                    )}
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

            {/* 참석 버튼 - 모임, 행사, 소그룹, 차량이용 카테고리에서만 표시 */}
            {(['meeting', 'event', 'smallgroup', 'vehicle'].includes(event.category)) && user && isInitialized && (
              <div className="pt-4 border-t border-secondary-200">
                <Button
                  onClick={handleAttendance}
                  loading={isLoading}
                  disabled={isLoading || (!!event.maxAttendees && currentAttendees >= event.maxAttendees && !isAttending)}
                  className={`w-full ${
                    isAttending 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isLoading 
                    ? '처리 중...' 
                    : isAttending 
                      ? '참석 취소' 
                      : !!event.maxAttendees && currentAttendees >= event.maxAttendees
                        ? '참석 마감'
                        : '참석하기'
                  }
                </Button>
                {!!event.maxAttendees && currentAttendees >= event.maxAttendees && !isAttending && (
                  <p className="text-sm text-red-500 text-center mt-2">
                    참석 인원이 가득 찼습니다.
                  </p>
                )}
              </div>
            )}

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
