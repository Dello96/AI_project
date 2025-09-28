'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { User, AuthState, SignupForm, SignInData } from '@/types'
import { supabase } from '@/lib/supabase'

interface AuthStore extends AuthState {
  // Actions
  signUp: (data: SignupForm) => Promise<{ success: boolean; message: string }>
  signIn: (data: SignInData) => Promise<{ success: boolean; message: string }>
  signOut: () => Promise<void>
  checkUser: () => Promise<boolean>
  refreshToken: () => Promise<boolean>
  getAccessToken: () => Promise<string | null>
  initializeAuth: () => Promise<(() => void) | undefined>
  scheduleTokenRefresh: (expiresIn: number) => void
}

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    user: null,
    isLoading: true,
    error: null,

    // Actions
    signUp: async (data: SignupForm) => {
      try {
        set({ isLoading: true, error: null })

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name,
              phone: data.phone
            }
          }
        })

        if (authError) {
          set({ error: authError.message, isLoading: false })
          return { success: false, message: authError.message }
        }

        if (authData.user) {
          // 사용자 프로필 생성
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              name: data.name,
              email: data.email,
              phone: data.phone,
              role: 'member',
              is_approved: false
            })

          if (profileError) {
            console.error('프로필 생성 오류:', profileError)
          }

          set({ 
            user: {
              id: authData.user.id,
              email: data.email,
              name: data.name,
              ...(data.phone && { phone: data.phone }),
              role: 'member',
              isApproved: false,
              provider: 'email',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            isLoading: false,
            error: null
          })

          return { 
            success: true, 
            message: '회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.' 
          }
        }

        return { success: false, message: '회원가입에 실패했습니다.' }
      } catch (error: any) {
        const errorMessage = error.message || '회원가입 중 오류가 발생했습니다.'
        set({ error: errorMessage, isLoading: false })
        return { success: false, message: errorMessage }
      }
    },

    signIn: async (data: SignInData) => {
      try {
        set({ isLoading: true, error: null })

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        })

        if (authError) {
          set({ error: authError.message, isLoading: false })
          return { success: false, message: authError.message }
        }

        if (authData.user) {
          // 사용자 프로필 정보 가져오기
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('name, email, role, is_approved, phone')
            .eq('id', authData.user.id)
            .single()

          const user: User = {
            id: authData.user.id,
            email: authData.user.email || '',
            name: userProfile?.name || authData.user.email?.split('@')[0] || '사용자',
            ...(userProfile?.phone && { phone: userProfile.phone }),
            role: userProfile?.role || 'member',
            isApproved: userProfile?.is_approved || false,
            provider: authData.user.app_metadata?.provider || 'email',
            createdAt: new Date(authData.user.created_at),
            updatedAt: new Date()
          }

          set({ 
            user,
            isLoading: false,
            error: null
          })

          // 토큰 갱신 스케줄링
          if (authData.session?.expires_in) {
            get().scheduleTokenRefresh(authData.session.expires_in)
          }

          return { success: true, message: '로그인에 성공했습니다.' }
        }

        return { success: false, message: '로그인에 실패했습니다.' }
      } catch (error: any) {
        const errorMessage = error.message || '로그인 중 오류가 발생했습니다.'
        set({ error: errorMessage, isLoading: false })
        return { success: false, message: errorMessage }
      }
    },

    signOut: async () => {
      try {
        set({ isLoading: true })
        
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          console.error('로그아웃 오류:', error)
        }

        set({ 
          user: null, 
          isLoading: false, 
          error: null 
        })
      } catch (error: any) {
        console.error('로그아웃 오류:', error)
        set({ 
          user: null, 
          isLoading: false, 
          error: '로그아웃 중 오류가 발생했습니다.' 
        })
      }
    },

    checkUser: async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('세션 확인 오류:', error)
          set({ user: null, isLoading: false, error: error.message })
          return false
        }

        if (session?.user) {
          // 사용자 프로필 정보 가져오기
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('name, email, role, is_approved, phone')
            .eq('id', session.user.id)
            .single()

          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: userProfile?.name || session.user.email?.split('@')[0] || '사용자',
            ...(userProfile?.phone && { phone: userProfile.phone }),
            role: userProfile?.role || 'member',
            isApproved: userProfile?.is_approved || false,
            provider: session.user.app_metadata?.provider || 'email',
            createdAt: new Date(session.user.created_at),
            updatedAt: new Date()
          }

          set({ 
            user,
            isLoading: false,
            error: null
          })

          return true
        }

        set({ user: null, isLoading: false, error: null })
        return false
      } catch (error: any) {
        console.error('사용자 확인 오류:', error)
        set({ user: null, isLoading: false, error: error.message })
        return false
      }
    },

    refreshToken: async () => {
      try {
        console.log('토큰 갱신 시도...')
        const { data: { session }, error } = await supabase.auth.refreshSession()
        
        if (error) {
          console.error('토큰 갱신 실패:', error)
          return false
        }
        
        if (session?.user) {
          console.log('토큰 갱신 성공, 사용자 상태 업데이트')
          
          // 사용자 프로필 정보 가져오기
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('name, email, role, is_approved, phone')
            .eq('id', session.user.id)
            .single()
          
          // 상태 업데이트
          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              name: userProfile?.name || session.user.email?.split('@')[0] || '사용자',
              ...(userProfile?.phone && { phone: userProfile.phone }),
              role: userProfile?.role || 'member',
              isApproved: userProfile?.is_approved || false,
              provider: session.user.app_metadata?.provider || 'email',
              createdAt: new Date(session.user.created_at),
              updatedAt: new Date()
            },
            isLoading: false,
            error: null
          })
          
          return true
        }
        
        return false
      } catch (error) {
        console.error('토큰 갱신 오류:', error)
        return false
      }
    },

    getAccessToken: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token || null
      } catch (error) {
        console.error('액세스 토큰 가져오기 오류:', error)
        return null
      }
    },

    initializeAuth: async () => {
      try {
        await get().checkUser()
        
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
              
              set({
                user: userData,
                isLoading: false,
                error: null
              })
              
              // 토큰 갱신 스케줄링
              if (session.expires_in) {
                get().scheduleTokenRefresh(session.expires_in)
              }
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                isLoading: false,
                error: null
              })
            }
          }
        )

        // 컴포넌트 언마운트 시 구독 해제
        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('인증 초기화 오류:', error)
        set({
          user: null,
          isLoading: false,
          error: '인증 확인 중 오류가 발생했습니다.'
        })
      }
    },

    // Helper function for token refresh scheduling
    scheduleTokenRefresh: (expiresIn: number) => {
      const refreshTime = (expiresIn - 60) * 1000 // 1분 전에 갱신
      
      setTimeout(async () => {
        const success = await get().refreshToken()
        if (success) {
          // 성공 시 다음 갱신 스케줄링
          get().scheduleTokenRefresh(expiresIn)
        } else {
          // 실패 시 로그아웃
          await get().signOut()
        }
      }, refreshTime)
    }
  }))
)
