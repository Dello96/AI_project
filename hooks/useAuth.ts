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
      
      // 개발 모드에서 테스트 계정 허용
      if (process.env.NODE_ENV === 'development' && 
          data.email === 'test@example.com' && 
          data.password === 'test123') {
        
        // 테스트 사용자 생성
        const testUser: User = {
          id: 'test-user-id',
          email: 'test@example.com',
          name: '테스트 사용자',
          phone: '010-1234-5678',
          churchDomain: 'test',
          role: 'member',
          isApproved: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        setAuthState({
          user: testUser,
          isLoading: false,
          error: null
        })
        
        return { success: true }
      }
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (authError) throw authError

      if (authData.user) {
        await checkUser()
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.'
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, message: errorMessage }
    }
  }, [checkUser])

  // 로그아웃
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setAuthState({
        user: null,
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('로그아웃 오류:', error)
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

  // 초기 로드 시 사용자 확인
  useEffect(() => {
    checkUser()
    
    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await checkUser()
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            isLoading: false,
            error: null
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [checkUser])

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    checkUser,
    isValidChurchDomain
  }
}
