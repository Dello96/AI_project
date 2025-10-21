'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

/**
 * useAuth - authStore를 wrapping하는 편의 훅
 * 
 * Supabase 자동 토큰 갱신 방식으로 통합됨:
 * - autoRefreshToken: true로 설정되어 Supabase가 자동 갱신 처리
 * - onAuthStateChange로 모든 인증 상태 변경 감지
 * - 중복된 수동 토큰 갱신 로직 제거
 */
export function useAuth() {
  const authStore = useAuthStore()

  // 초기 인증 설정 (한 번만 실행)
  useEffect(() => {
    let cleanup: (() => void) | undefined

    const initAuth = async () => {
      cleanup = await authStore.initializeAuth()
    }

    initAuth()

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (cleanup) cleanup()
    }
  }, []) // authStore.initializeAuth는 안정적이므로 의존성 배열에서 제외

  // 교회 도메인 검증 (개발 중에는 모든 도메인 허용)
  const isValidChurchDomain = (email: string): boolean => {
    // 개발 중에는 모든 도메인 허용
    if (process.env.NODE_ENV === 'development') {
      return true
    }
    
    const allowedDomains = [
      'church.kr',
      'youth.kr',
      'ministry.kr',
      'gospel.kr'
    ]
    
    const domain = email.split('@')[1]
    if (!domain) return false
    
    return allowedDomains.some(allowed => domain === allowed || domain.endsWith(`.${allowed}`))
  }

  return {
    // 상태
    user: authStore.user,
    isLoading: authStore.isLoading,
    error: authStore.error,
    
    // 액션
    signUp: authStore.signUp,
    signIn: authStore.signIn,
    signOut: authStore.signOut,
    checkUser: authStore.checkUser,
    getAccessToken: authStore.getAccessToken,
    
    // 유틸리티
    isValidChurchDomain
  }
}
