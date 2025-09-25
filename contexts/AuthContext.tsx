'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { User, AuthState, SignupForm, SignInData } from '@/types'
import { supabase } from '@/lib/supabase'

interface AuthContextType extends AuthState {
  signUp: (data: SignupForm) => Promise<{ success: boolean; message: string }>
  signIn: (data: SignInData) => Promise<{ success: boolean; message: string }>
  signOut: () => Promise<void>
  checkUser: () => Promise<boolean>
  refreshToken: () => Promise<boolean>
  isValidChurchDomain: (email: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  })
  
  const isInitialized = useRef(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 토큰 갱신 함수
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('토큰 갱신 시도...')
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('토큰 갱신 실패:', error)
        return false
      }
      
      if (session?.user) {
        console.log('토큰 갱신 성공')
        return true
      }
      
      return false
    } catch (error) {
      console.error('토큰 갱신 오류:', error)
      return false
    }
  }, [])

  // 사용자 세션 확인
  const checkUser = useCallback(async (): Promise<boolean> => {
    try {
      console.log('사용자 세션 확인 중...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('세션 확인 오류:', error)
        setAuthState(prev => ({
          ...prev,
          user: null,
          isLoading: false,
          error: '세션 확인 중 오류가 발생했습니다.'
        }))
        return false
      }
      
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || session.user.user_metadata?.email || '',
          name: session.user.user_metadata?.name || 
                session.user.user_metadata?.full_name || 
                session.user.user_metadata?.nickname || 
                '사용자',
          phone: session.user.user_metadata?.phone || null,
          role: 'member',
          isApproved: true,
          createdAt: new Date(session.user.created_at || new Date()),
          updatedAt: new Date(session.user.updated_at || new Date()),
          provider: session.user.app_metadata?.provider || 'email',
          avatarUrl: session.user.user_metadata?.avatar_url || 
                    session.user.user_metadata?.picture || 
                    session.user.user_metadata?.profile_image || 
                    undefined
        }
        
        setAuthState(prev => ({
          ...prev,
          user: userData,
          isLoading: false,
          error: null
        }))
        
        console.log('사용자 세션 확인 성공:', userData.email)
        return true
      } else {
        setAuthState(prev => ({
          ...prev,
          user: null,
          isLoading: false,
          error: null
        }))
        console.log('사용자 세션 없음')
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

  // 가입 요청
  const signUp = useCallback(async (data: SignupForm) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      
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
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return { success: true, message: result.message }
      } else {
        throw new Error(result.error || '가입 요청에 실패했습니다.')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '가입 요청 중 오류가 발생했습니다.'
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, message: errorMessage }
    }
  }, [])

  // 로그인
  const signIn = useCallback(async (data: SignInData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      
      console.log('로그인 시도:', data.email)
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })
      
      if (authError) {
        console.error('Supabase 인증 오류:', authError)
        
        let errorMessage = '로그인에 실패했습니다.'
        
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = '이메일 인증이 필요합니다. 이메일을 확인해주세요.'
        } else if (authError.message.includes('Too many requests')) {
          errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
        } else if (authError.message.includes('User not found')) {
          errorMessage = '등록되지 않은 이메일입니다.'
        } else {
          errorMessage = `로그인 오류: ${authError.message}`
        }
        
        throw new Error(errorMessage)
      }
      
      if (authData.user) {
        const userData: User = {
          id: authData.user.id,
          email: authData.user.email || '',
          name: authData.user.user_metadata?.name || '사용자',
          phone: authData.user.user_metadata?.phone || null,
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
        
        console.log('로그인 성공:', userData.email)
        return { success: true, message: '로그인에 성공했습니다.' }
      } else {
        throw new Error('사용자 정보를 찾을 수 없습니다.')
      }
    } catch (error) {
      console.error('로그인 에러:', error)
      
      const errorMessage = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.'
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }))
      
      return { success: false, message: errorMessage }
    }
  }, [])

  // 로그아웃
  const signOut = useCallback(async () => {
    try {
      console.log('로그아웃 시도...')
      
      // 토큰 갱신 타이머 정리
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('로그아웃 오류:', error)
      }
      
      setAuthState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        error: null
      }))
      
      console.log('로그아웃 완료')
    } catch (error) {
      console.error('로그아웃 오류:', error)
      setAuthState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        error: null
      }))
    }
  }, [])

  // 교회 도메인 검증
  const isValidChurchDomain = useCallback((email: string): boolean => {
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
  }, [])

  // 토큰 갱신 스케줄링
  const scheduleTokenRefresh = useCallback((expiresIn: number) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    // 만료 5분 전에 갱신
    const refreshTime = Math.max(0, (expiresIn - 300) * 1000)
    
    refreshTimeoutRef.current = setTimeout(async () => {
      console.log('자동 토큰 갱신 시도...')
      const success = await refreshToken()
      
      if (!success) {
        console.log('토큰 갱신 실패, 로그아웃 처리')
        await signOut()
      }
    }, refreshTime)
  }, [refreshToken, signOut])

  // 초기화
  useEffect(() => {
    const initializeAuth = async () => {
      if (isInitialized.current) return
      isInitialized.current = true
      
      try {
        await checkUser()
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
    
    initializeAuth()
    
    // Auth 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth 상태 변경:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '사용자',
            phone: session.user.user_metadata?.phone || null,
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
          
          // 토큰 갱신 스케줄링
          if (session.expires_in) {
            scheduleTokenRefresh(session.expires_in)
          }
        } else if (event === 'SIGNED_OUT') {
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
            refreshTimeoutRef.current = null
          }
          
          setAuthState(prev => ({
            ...prev,
            user: null,
            isLoading: false,
            error: null
          }))
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('토큰 갱신됨')
          // 토큰 갱신 후 새로운 스케줄링
          if (session.expires_in) {
            scheduleTokenRefresh(session.expires_in)
          }
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [checkUser, scheduleTokenRefresh])

  const value: AuthContextType = {
    ...authState,
    signUp,
    signIn,
    signOut,
    checkUser,
    refreshToken,
    isValidChurchDomain
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
