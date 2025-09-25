'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

interface KakaoLoginButtonProps {
  onSuccess?: () => void
  className?: string
}

export default function KakaoLoginButton({ onSuccess, className = '' }: KakaoLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true)
      
      // 카카오 소셜 로그인 API 호출
      const response = await fetch('/api/auth/kakao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success && result.redirectUrl) {
        // 카카오 로그인 페이지로 리다이렉트
        window.location.href = result.redirectUrl
      } else {
        console.error('카카오 로그인 시작 실패:', result.error)
        alert('카카오 로그인을 시작할 수 없습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error)
      alert('카카오 로그인 중 오류가 발생했습니다.')
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
        className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-[#3C1E1E] border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3C6.48 3 2 6.48 2 10.5C2 13.52 4.5 16.1 8 16.9V21L12 19L16 21V16.9C19.5 16.1 22 13.52 22 10.5C22 6.48 17.52 3 12 3Z"
                fill="#3C1E1E"
              />
            </svg>
            카카오로 로그인
          </>
        )}
      </Button>
    </motion.div>
  )
}