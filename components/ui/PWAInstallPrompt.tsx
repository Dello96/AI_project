'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, DownloadIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'
import { usePWA } from '@/hooks/usePWA'
import { Button } from './Button'

export default function PWAInstallPrompt() {
  const { deferredPrompt, isInstalled, installPWA } = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // PWA가 설치되지 않았고 설치 프롬프트가 있을 때만 표시
    if (deferredPrompt && !isInstalled) {
      // 사용자가 이전에 거부했다면 24시간 후에 다시 표시
      const dismissedTime = localStorage.getItem('pwa-prompt-dismissed')
      const now = Date.now()
      const oneDay = 24 * 60 * 60 * 1000

      if (!dismissedTime || (now - parseInt(dismissedTime)) > oneDay) {
        setIsVisible(true)
      }
    }
  }, [deferredPrompt, isInstalled])

  const handleInstall = async () => {
    try {
      setIsInstalling(true)
      const success = await installPWA()
      
      if (success) {
        setIsVisible(false)
        // 성공적으로 설치되면 더 이상 프롬프트 표시 안함
        localStorage.setItem('pwa-installed', 'true')
      }
    } catch (error) {
      console.error('PWA 설치 실패:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // 24시간 동안 다시 표시하지 않음
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-xl shadow-2xl border border-secondary-200 z-50"
      >
        <div className="p-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DevicePhoneMobileIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-secondary-900">앱 설치</h3>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-secondary-500" />
            </button>
          </div>

          {/* 내용 */}
          <p className="text-sm text-secondary-600 mb-4">
            청년부 커뮤니티를 홈 화면에 추가하여 더 빠르게 접근하고 알림을 받아보세요.
          </p>

          {/* 버튼 */}
          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              {isInstalling ? '설치 중...' : '설치하기'}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
            >
              나중에
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
