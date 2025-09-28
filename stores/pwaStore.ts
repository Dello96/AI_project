'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAStore {
  // State
  isInstallable: boolean
  installPrompt: PWAInstallPrompt | null
  isInstalled: boolean
  isStandalone: boolean
  notificationPermission: NotificationPermission
  isOnline: boolean
  
  // Actions
  setInstallable: (installable: boolean) => void
  setInstallPrompt: (prompt: PWAInstallPrompt | null) => void
  setInstalled: (installed: boolean) => void
  setStandalone: (standalone: boolean) => void
  setNotificationPermission: (permission: NotificationPermission) => void
  setOnline: (online: boolean) => void
  requestNotificationPermission: () => Promise<NotificationPermission>
  installApp: () => Promise<boolean>
  initializePWA: () => void
}

export const usePWAStore = create<PWAStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isInstallable: false,
    installPrompt: null,
    isInstalled: false,
    isStandalone: false,
    notificationPermission: 'default',
    isOnline: true,

    // Actions
    setInstallable: (installable) => {
      set({ isInstallable: installable })
    },

    setInstallPrompt: (prompt) => {
      set({ installPrompt: prompt })
    },

    setInstalled: (installed) => {
      set({ isInstalled: installed })
    },

    setStandalone: (standalone) => {
      set({ isStandalone: standalone })
    },

    setNotificationPermission: (permission) => {
      set({ notificationPermission: permission })
    },

    setOnline: (online) => {
      set({ isOnline: online })
    },

    requestNotificationPermission: async () => {
      try {
        if (!('Notification' in window)) {
          console.log('이 브라우저는 알림을 지원하지 않습니다.')
          return 'denied'
        }

        const permission = await Notification.requestPermission()
        set({ notificationPermission: permission })
        return permission
      } catch (error) {
        console.error('알림 권한 요청 오류:', error)
        return 'denied'
      }
    },

    installApp: async () => {
      const { installPrompt } = get()
      
      if (!installPrompt) {
        console.log('설치 프롬프트를 사용할 수 없습니다.')
        return false
      }

      try {
        await installPrompt.prompt()
        const { outcome } = await installPrompt.userChoice
        
        if (outcome === 'accepted') {
          set({ isInstalled: true, installPrompt: null })
          return true
        } else {
          console.log('사용자가 앱 설치를 거부했습니다.')
          return false
        }
      } catch (error) {
        console.error('앱 설치 오류:', error)
        return false
      }
    },

    initializePWA: () => {
      // PWA 설치 가능 여부 감지
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        set({ 
          isInstallable: true,
          installPrompt: e as any
        })
      }

      // PWA 설치 완료 감지
      const handleAppInstalled = () => {
        set({ 
          isInstalled: true,
          installPrompt: null,
          isInstallable: false
        })
      }

      // 온라인 상태 감지
      const handleOnline = () => set({ isOnline: true })
      const handleOffline = () => set({ isOnline: false })

      // 알림 권한 상태 확인
      if ('Notification' in window) {
        set({ notificationPermission: Notification.permission })
      }

      // PWA 모드 확인
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true
      set({ isStandalone })

      // 이벤트 리스너 등록
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      // 클린업 함수 반환
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }))
)
