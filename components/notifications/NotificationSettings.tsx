'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BellIcon, 
  EnvelopeIcon, 
  DevicePhoneMobileIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { usePWAStore } from '@/stores/pwaStore'

interface NotificationSettings {
  pushNotifications: boolean
  emailNotifications: boolean
  eventReminders: boolean
  postNotifications: boolean
  systemNotifications: boolean
  reminderTime: number // 분 단위
}

export default function NotificationSettings() {
  const { user } = useAuthStore()
  const { notificationPermission, requestNotificationPermission } = usePWAStore()
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    eventReminders: true,
    postNotifications: true,
    systemNotifications: true,
    reminderTime: 30
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      loadNotificationSettings()
    }
  }, [user])

  // 알림 설정 로드
  const loadNotificationSettings = async () => {
    try {
      // 로컬 스토리지에서 설정 로드
      const savedSettings = localStorage.getItem('notification-settings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error('알림 설정 로드 오류:', error)
    }
  }

  // 알림 설정 저장
  const saveNotificationSettings = async () => {
    try {
      setIsLoading(true)
      
      // 로컬 스토리지에 설정 저장
      localStorage.setItem('notification-settings', JSON.stringify(settings))
      
      // 푸시 알림 권한 요청
      if (settings.pushNotifications && notificationPermission !== 'granted') {
        const granted = await requestNotificationPermission()
        if (!granted) {
          setSettings(prev => ({ ...prev, pushNotifications: false }))
          setMessage({
            type: 'error',
            text: '푸시 알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.'
          })
          return
        }
      }

      setMessage({
        type: 'success',
        text: '알림 설정이 저장되었습니다.'
      })

      // 3초 후 메시지 제거
      setTimeout(() => setMessage(null), 3000)

    } catch (error) {
      console.error('알림 설정 저장 오류:', error)
      setMessage({
        type: 'error',
        text: '알림 설정 저장에 실패했습니다.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 설정 변경 핸들러
  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // 테스트 알림 발송
  const sendTestNotification = async () => {
    try {
      if (settings.pushNotifications && notificationPermission === 'granted') {
        new Notification('테스트 알림', {
          body: '알림 설정이 정상적으로 작동합니다!',
          icon: '/icons/icon-192x192.svg'
        })
      }

      if (settings.emailNotifications) {
        // 이메일 테스트 알림 발송 (실제 구현에서는 API 호출)
      }

      setMessage({
        type: 'success',
        text: '테스트 알림이 발송되었습니다.'
      })

      setTimeout(() => setMessage(null), 3000)

    } catch (error) {
      console.error('테스트 알림 발송 오류:', error)
      setMessage({
        type: 'error',
        text: '테스트 알림 발송에 실패했습니다.'
      })
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="w-5 h-5" />
            알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 푸시 알림 설정 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DevicePhoneMobileIcon className="w-5 h-5 text-blue-500" />
              푸시 알림
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium">웹 푸시 알림</p>
                <p className="text-sm text-gray-600">
                  브라우저를 통해 실시간 알림을 받습니다
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  className="sr-only peer"
                  disabled={notificationPermission === 'denied'}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {notificationPermission === 'denied' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  푸시 알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.
                </p>
              </div>
            )}
          </div>

          {/* 이메일 알림 설정 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <EnvelopeIcon className="w-5 h-5 text-green-500" />
              이메일 알림
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">이메일 알림</p>
                  <p className="text-sm text-gray-600">중요한 알림을 이메일로 받습니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">일정 리마인더</p>
                  <p className="text-sm text-gray-600">일정 전 미리 알림을 받습니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.eventReminders}
                    onChange={(e) => handleSettingChange('eventReminders', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 알림 유형 설정 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">알림 유형</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">공지사항 알림</p>
                  <p className="text-sm text-gray-600">새로운 공지사항 등록 시</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.postNotifications}
                    onChange={(e) => handleSettingChange('postNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">시스템 알림</p>
                  <p className="text-sm text-gray-600">중요한 시스템 공지</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.systemNotifications}
                    onChange={(e) => handleSettingChange('systemNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 리마인더 시간 설정 */}
          {settings.eventReminders && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">리마인더 시간</h3>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <label className="block text-sm font-medium mb-2">
                  일정 시작 전 {settings.reminderTime}분
                </label>
                <input
                  type="range"
                  min="5"
                  max="1440"
                  step="5"
                  value={settings.reminderTime}
                  onChange={(e) => handleSettingChange('reminderTime', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5분</span>
                  <span>1시간</span>
                  <span>1일</span>
                </div>
              </div>
            </div>
          )}

          {/* 메시지 표시 */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckIcon className="w-5 h-5 text-green-600" />
              ) : (
                <XMarkIcon className="w-5 h-5 text-red-600" />
              )}
              {message.text}
            </motion.div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={saveNotificationSettings}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? '저장 중...' : '설정 저장'}
            </Button>
            
            <Button
              onClick={sendTestNotification}
              variant="outline"
              disabled={!settings.pushNotifications && !settings.emailNotifications}
            >
              테스트 알림
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
