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
      
      // 모바일 환경 감지
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)
      
      // Supabase OAuth를 사용할 때는 Supabase 도메인을 리다이렉트 URI로 사용
      const redirectUrl = `${window.location.origin}/auth/callback`
      
      // Supabase OAuth 설정 확인
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Supabase 리다이렉트 URL:', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`)
      
      console.log('=== 카카오 로그인 디버깅 정보 ===')
      console.log('현재 도메인:', window.location.origin)
      console.log('카카오 로그인 리다이렉트 URL:', redirectUrl)
      console.log('전체 URL:', window.location.href)
      console.log('User-Agent:', navigator.userAgent)
      console.log('모바일 여부:', isMobile)
      console.log('iOS 여부:', isIOS)
      console.log('Android 여부:', isAndroid)
      console.log('화면 크기:', `${window.screen.width}x${window.screen.height}`)
      console.log('뷰포트 크기:', `${window.innerWidth}x${window.innerHeight}`)
      console.log('HTTPS 여부:', window.location.protocol === 'https:')
      console.log('================================')
      
      // 모바일 환경에 따른 OAuth 옵션 설정
      const oauthOptions: any = {
        redirectTo: redirectUrl
      }
      
      // 모바일에서는 팝업 대신 전체 페이지 리다이렉트 사용
      if (isMobile) {
        oauthOptions.queryParams = {
          prompt: 'select_account' // 계정 선택 강제
        }
        console.log('모바일 환경: 전체 페이지 리다이렉트 모드 사용')
      } else {
        console.log('PC 환경: 팝업 모드 사용')
      }
      
      console.log('OAuth 옵션:', oauthOptions)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: oauthOptions
      })

      if (error) {
        console.error('=== 카카오 로그인 오류 상세 정보 ===')
        console.error('에러 코드:', error.status)
        console.error('에러 메시지:', error.message)
        console.error('전체 에러 객체:', error)
        console.error('모바일 환경:', isMobile)
        console.error('================================')
        
        // 모바일 특화 에러 메시지
        let errorMessage = error.message
        if (isMobile) {
          if (error.message.includes('popup')) {
            errorMessage = '모바일에서는 팝업이 차단될 수 있습니다. 브라우저 설정에서 팝업을 허용해주세요.'
          } else if (error.message.includes('redirect')) {
            errorMessage = '리다이렉트 오류가 발생했습니다. 페이지를 새로고침 후 다시 시도해주세요.'
          } else if (error.message.includes('network')) {
            errorMessage = '네트워크 연결을 확인해주세요.'
          }
        }
        
        onError?.(errorMessage)
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
