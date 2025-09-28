'use client'

import { useEffect } from 'react'
import { useAuthStore } from './authStore'
import { useEventsStore } from './eventsStore'
import { usePWAStore } from './pwaStore'
import { usePermissionsStore } from './permissionsStore'

interface StoreProviderProps {
  children: React.ReactNode
}

export function StoreProvider({ children }: StoreProviderProps) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const initializeRealtime = useEventsStore((state) => state.initializeRealtime)
  const initializePWA = usePWAStore((state) => state.initializePWA)
  const setUser = usePermissionsStore((state) => state.setUser)
  const user = useAuthStore((state) => state.user)

  // Auth 초기화
  useEffect(() => {
    const cleanup = initializeAuth()
    return () => {
      if (cleanup) {
        cleanup.then(cleanupFn => cleanupFn?.())
      }
    }
  }, [initializeAuth])

  // Events 실시간 구독 초기화
  useEffect(() => {
    const cleanup = initializeRealtime()
    return cleanup
  }, [initializeRealtime])

  // PWA 초기화
  useEffect(() => {
    const cleanup = initializePWA()
    return cleanup
  }, [initializePWA])

  // 사용자 정보를 Permissions store에 동기화
  useEffect(() => {
    setUser(user)
  }, [user, setUser])

  return <>{children}</>
}
