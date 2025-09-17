'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

interface KakaoLoginButtonProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
}

export default function KakaoLoginButton({ 
  onSuccess, 
  onError, 
  className = '' 
}: KakaoLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true)
      
      // 현재 도메인을 동적으로 가져오기
      const redirectUrl = `${window.location.origin}/auth/callback`
      console.log('카카오 로그인 리다이렉트 URL:', redirectUrl)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: redirectUrl
        }
      })

      if (error) {
        console.error('카카오 로그인 오류:', error)
        onError?.(error.message)
        return
      }

      // 성공적으로 리다이렉트되면 onSuccess 호출
      onSuccess?.()
    } catch (error) {
      console.error('카카오 로그인 예외:', error)
      onError?.('카카오 로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Button
        onClick={handleKakaoLogin}
        disabled={isLoading}
        className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-[#3C1E1E] border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11L6.526 21.75c-.5.5-1.5.5-2 0s-.5-1.5 0-2l3.747-3.747A13.5 13.5 0 0 1 1.5 11.185C1.5 6.664 6.201 3 12 3z"/>
          </svg>
        )}
        {isLoading ? '카카오 로그인 중...' : '카카오로 로그인'}
      </Button>
    </motion.div>
  )
}
