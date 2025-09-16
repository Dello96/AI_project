'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { User, AuthState, SignupForm, SignInData } from '@/types'
import { supabase } from '@/lib/supabase'
import { userService } from '@/lib/database'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  })
  
  // 초기화 플래그를 useRef로 관리
  const isInitialized = useRef(false)

  // 사용자 세션 확인 (수동 호출용)
  const checkUser = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('세션 확인 오류:', error)
        return false
      }
      
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || '사용자',
          phone: session.user.user_metadata?.phone || null,
          // churchDomain 제거됨 (단순화)
          role: 'member',
          isApproved: true,
          createdAt: new Date(session.user.created_at || new Date()),
          updatedAt: new Date(session.user.updated_at || new Date())
        }
        
        setAuthState(prev => ({
          ...prev,
          user: userData,
          isLoading: false,
          error: null
        }))
        return true
      } else {
        setAuthState(prev => ({
          ...prev,
          user: null,
          isLoading: false,
          error: null
        }))
        return false
      }
    } catch (error) {
      console.error('사용자 세션 확인 오류:', error)
      setAuthState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        error: '사용자 인증 확인 중 오류가 발생했습니다.'
      }))
      return false
    }
  }, [])

  // 가입 요청 (더 이상 직접 회원가입하지 않음)
  const signUp = useCallback(async (data: SignupForm) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true, error: null }))
      
      // 가입 요청 API 호출
      const response = await fetch('/api/auth/signup-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone || undefined,

        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }))
        return { success: true, message: result.message }
      } else {
        throw new Error(result.error || '가입 요청에 실패했습니다.')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '가입 요청 중 오류가 발생했습니다.'
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, message: errorMessage }
    }
  }, [])

  // 로그인
  const signIn = useCallback(async (data: SignInData) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true, error: null }))
      
      // Supabase Auth 직접 사용
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })
      
      if (authError) {
        throw new Error(authError.message)
      }
      
      if (authData.user) {
        const userData: User = {
          id: authData.user.id,
          email: authData.user.email || '',
          name: authData.user.user_metadata?.name || '사용자',
          phone: authData.user.user_metadata?.phone || null,
          // churchDomain 제거됨 (단순화)
          role: 'member',
          isApproved: true,
          createdAt: new Date(authData.user.created_at || new Date()),
          updatedAt: new Date(authData.user.updated_at || new Date())
        }
        
        setAuthState(prev => ({
          ...prev,
          user: userData,
          isLoading: false,
          error: null
        }))
        
        console.log('로그인 성공 - 사용자 정보:', userData)
        return { success: true, message: '로그인에 성공했습니다.' }
      } else {
        throw new Error('사용자 정보를 찾을 수 없습니다.')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.'
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, message: errorMessage }
    }
  }, [])

  // 로그아웃
  const signOut = useCallback(async () => {
    try {
      // Supabase Auth 직접 사용
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('로그아웃 오류:', error)
      }
      
      // 로컬 상태 초기화
      setAuthState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        error: null
      }))
    } catch (error) {
      console.error('로그아웃 오류:', error)
      // 오류가 발생해도 로컬 상태는 초기화
      setAuthState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        error: null
      }))
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
    const initializeAuth = async () => {
      if (isInitialized.current) return
      isInitialized.current = true
      
      try {
        // Supabase Auth 세션 확인
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('세션 확인 오류:', error)
          setAuthState(prev => ({
            ...prev,
            user: null,
            isLoading: false,
            error: null
          }))
          return
        }
        
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '사용자',
            phone: session.user.user_metadata?.phone || null,
            // churchDomain 제거됨 (단순화)
            role: 'member',
            isApproved: true,
            createdAt: new Date(session.user.created_at || new Date()),
            updatedAt: new Date(session.user.updated_at || new Date())
          }
          
          console.log('세션에서 사용자 정보 발견:', userData)
          setAuthState(prev => ({
            ...prev,
            user: userData,
            isLoading: false,
            error: null
          }))
        } else {
          console.log('세션에 사용자 정보 없음')
          setAuthState(prev => ({
            ...prev,
            user: null,
            isLoading: false,
            error: null
          }))
        }
      } catch (error) {
        console.error('인증 초기화 오류:', error)
        setAuthState(prev => ({
          ...prev,
          user: null,
          isLoading: false,
          error: '인증 확인 중 오류가 발생했습니다.'
        }))
      }
    }
    
    // 즉시 초기화 시작
    initializeAuth()
    
    // Supabase Auth 상태 변경 감지 (초기화 후에만)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // 초기화가 완료된 후에만 상태 변경 처리
        if (!isInitialized.current) return
        
        // 토큰 갱신 이벤트는 무시 (무한 루프 방지)
        if (event === 'TOKEN_REFRESHED') {
          console.log('토큰 갱신 이벤트 무시됨')
          return
        }
        
        console.log('Auth 상태 변경:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '사용자',
            phone: session.user.user_metadata?.phone || null,
            // churchDomain 제거됨 (단순화)
            role: 'member',
            isApproved: true,
            createdAt: new Date(session.user.created_at || new Date()),
            updatedAt: new Date(session.user.updated_at || new Date())
          }
          
          console.log('SIGNED_IN 이벤트 - 사용자 정보:', userData)
          setAuthState(prev => ({
            ...prev,
            user: userData,
            isLoading: false,
            error: null
          }))
        } else if (event === 'SIGNED_OUT') {
          console.log('SIGNED_OUT 이벤트')
          setAuthState(prev => ({
            ...prev,
            user: null,
            isLoading: false,
            error: null
          }))
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, []) // checkUser 의존성 제거

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    checkUser,
    isValidChurchDomain
  }
}
