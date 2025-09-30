import { useState, useEffect } from 'react'

interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // PWA 설치 프롬프트 감지
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as any)
    }

    // PWA 설치 완료 감지
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    // 알림 권한 상태 확인
    const checkNotificationPermission = () => {
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission)
      }
    }

    // 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    // 초기 권한 상태 확인
    checkNotificationPermission()

    // PWA 설치 상태 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // PWA 설치 프롬프트 표시
  const installPWA = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('PWA 설치 중 오류:', error)
      return false
    }
  }

  // 알림 권한 요청
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('이 브라우저는 알림을 지원하지 않습니다.')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      return permission === 'granted'
    } catch (error) {
      console.error('알림 권한 요청 중 오류:', error)
      return false
    }
  }

  // 푸시 알림 발송
  const sendPushNotification = async (title: string, options: NotificationOptions = {}): Promise<boolean> => {
    if (notificationPermission !== 'granted') {
      console.warn('알림 권한이 없습니다.')
      return false
    }

    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // Service Worker를 통한 푸시 알림
        const registration = await navigator.serviceWorker.ready
        
        await registration.showNotification(title, {
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-192x192.svg',
          tag: 'default',
          requireInteraction: true,
          silent: false,
          ...options
        })
        
        return true
      } else {
        // 기본 브라우저 알림
        new Notification(title, {
          icon: '/icons/icon-192x192.svg',
          ...options
        })
        
        return true
      }
    } catch (error) {
      console.error('푸시 알림 발송 실패:', error)
      return false
    }
  }

  // Service Worker 등록
  const registerServiceWorker = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
      console.warn('이 브라우저는 Service Worker를 지원하지 않습니다.')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      return true
    } catch (error) {
      console.error('Service Worker 등록 실패:', error)
      return false
    }
  }

  return {
    deferredPrompt,
    isInstalled,
    notificationPermission,
    installPWA,
    requestNotificationPermission,
    sendPushNotification,
    registerServiceWorker
  }
}
