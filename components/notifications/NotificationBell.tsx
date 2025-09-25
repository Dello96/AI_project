'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BellIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { usePWA } from '@/hooks/usePWA'
import { notificationService } from '@/lib/database'
import NotificationList from './NotificationList'

interface NotificationBellProps {
  className?: string
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const { user } = useAuth()
  const { notificationPermission, requestNotificationPermission, registerServiceWorker } = usePWA()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 읽지 않은 알림 개수 조회
  const fetchUnreadCount = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const notifications = await notificationService.getNotifications(user.id)
      const unread = notifications.filter(n => !(n as any).is_read).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 실시간 알림 업데이트 및 PWA 초기화
  useEffect(() => {
    if (!user) return

    // Service Worker 등록
    registerServiceWorker()

    // 초기 로드
    fetchUnreadCount()

    // 주기적으로 업데이트 (실제로는 Supabase Realtime 사용)
    const interval = setInterval(fetchUnreadCount, 30000) // 30초마다

    return () => clearInterval(interval)
  }, [user, registerServiceWorker])

  const handleBellClick = () => {
    if (user) {
      setIsNotificationOpen(true)
    }
  }

  const handleNotificationClose = () => {
    setIsNotificationOpen(false)
    // 알림 목록을 닫을 때 읽지 않은 개수 다시 조회
    fetchUnreadCount()
  }

  if (!user) return null

  return (
    <>
      <motion.button
        onClick={handleBellClick}
        className={`relative p-2 rounded-lg hover:bg-secondary-100 transition-colors ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isLoading}
      >
        <BellIcon className="w-6 h-6 text-secondary-600" />
        
        {/* 읽지 않은 알림 개수 표시 */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}

        {/* 알림 권한 상태 표시 */}
        {notificationPermission === 'denied' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"
            title="알림 권한이 거부되었습니다"
          />
        )}

        {/* 로딩 상태 표시 */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
          />
        )}
      </motion.button>

      {/* 알림 목록 모달 */}
      <NotificationList
        isOpen={isNotificationOpen}
        onClose={handleNotificationClose}
      />
    </>
  )
}
