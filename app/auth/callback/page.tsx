'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/Card'
import { motion } from 'framer-motion'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('로그인 처리 중...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('인증 오류:', error)
          setStatus('error')
          setMessage('로그인에 실패했습니다. 다시 시도해주세요.')
          return
        }

        if (data.session) {
          setStatus('success')
          setMessage('로그인에 성공했습니다!')
          
          // 2초 후 메인 페이지로 리다이렉트
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else {
          setStatus('error')
          setMessage('로그인 정보를 찾을 수 없습니다.')
        }
      } catch (error) {
        console.error('콜백 처리 오류:', error)
        setStatus('error')
        setMessage('로그인 처리 중 오류가 발생했습니다.')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-autumn-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {status === 'loading' && (
                <div className="w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 border-4 border-autumn-coral border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              {status === 'success' && (
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              {status === 'error' && (
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'loading' && '로그인 처리 중'}
              {status === 'success' && '로그인 성공!'}
              {status === 'error' && '로그인 실패'}
            </h2>
            
            <p className="text-gray-600 mb-6">{message}</p>

            {status === 'error' && (
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-autumn-coral text-white py-2 px-4 rounded-lg hover:bg-autumn-coral/90 transition-colors"
                >
                  다시 로그인하기
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  홈으로 돌아가기
                </button>
              </div>
            )}

            {status === 'success' && (
              <p className="text-sm text-gray-500">
                잠시 후 메인 페이지로 이동합니다...
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
