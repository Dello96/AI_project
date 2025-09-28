'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, AuthState, SignUpData, SignInData } from '@/types'
import { supabase } from '@/lib/supabase'
import { userService } from '@/lib/database'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  })

  // 사용자 세션 확인
  const checkUser = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      if (session?.user) {
        // 사용자 정보 조회
        const userData = await userService.getProfile(session.user.id)
        
        if (userData) {
          setAuthState({
            user: userData,
            isLoading: false,
            error: null
          })
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            error: '사용자 프로필을 찾을 수 없습니다.'
          })
        }
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          error: null
        })
      }
    } catch (error) {
      console.error('사용자 세션 확인 오류:', error)
      setAuthState({
        user: null,
        isLoading: false,
        error: '사용자 인증 확인 중 오류가 발생했습니다.'
      })
    }
  }, [])

  // 회원가입
  const signUp = useCallback(async (data: SignUpData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // 이메일 도메인 검증
      if (!isValidChurchDomain(data.email)) {
        throw new Error('교회 이메일 주소만 사용 가능합니다.')
      }

      // Supabase Auth로 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            churchDomain: data.churchDomain
          }
        }
      })

      if (authError) throw authError

      // 사용자 프로필 생성
      if (authData.user) {
        const profile = await userService.createProfile(authData.user.id, {
          email: data.email,
          name: data.name,
          phone: data.phone || '',
          churchDomain: data.churchDomain
        })

        if (!profile) {
          throw new Error('사용자 프로필 생성에 실패했습니다.')
        }
      }

      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: true, message: '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.'
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, message: errorMessage }
    }
  }, [])

  // 로그인
  const signIn = useCallback(async (data: SignInData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // 새로운 로그인 API 사용
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '로그인에 실패했습니다.')
      }
      
      if (result.success) {
        // 사용자 정보 설정
        setAuthState({
          user: result.user,
          isLoading: false,
          error: null
        })
        
        return { success: true, message: result.message }
      } else {
        throw new Error(result.error || '로그인에 실패했습니다.')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.'
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, message: errorMessage }
    }
  }, [])

  // 로그아웃
  const signOut = useCallback(async () => {
    try {
      // 새로운 로그아웃 API 사용
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      if (!response.ok) {
        console.error('로그아웃 API 오류:', response.statusText)
      }
      
      // 로컬 상태 초기화
      setAuthState({
        user: null,
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('로그아웃 오류:', error)
      // 오류가 발생해도 로컬 상태는 초기화
      setAuthState({
        user: null,
        isLoading: false,
        error: null
      })
    }
  }, [])

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

  // 자동 토큰 갱신
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.user) {
          setAuthState({
            user: result.user,
            isLoading: false,
            error: null
          })
          return true
        }
      }
      return false
    } catch (error) {
      console.error('토큰 갱신 오류:', error)
      return false
    }
  }, [])

  // 초기 로드 시 사용자 확인 및 토큰 갱신
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 먼저 토큰 갱신 시도
        const refreshed = await refreshToken()
        if (!refreshed) {
          // 토큰 갱신 실패 시 기존 방식으로 사용자 확인
          await checkUser()
        }
      } catch (error) {
        console.error('인증 초기화 오류:', error)
        setAuthState({
          user: null,
          isLoading: false,
          error: '인증 확인 중 오류가 발생했습니다.'
        })
      }
    }
    
    initializeAuth()
    
    // 주기적 토큰 갱신 (14분마다, 액세스 토큰 만료 1분 전)
    const refreshInterval = setInterval(refreshToken, 14 * 60 * 1000)
    
    return () => clearInterval(refreshInterval)
  }, [refreshToken, checkUser])

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    checkUser,
    isValidChurchDomain
  }
}
