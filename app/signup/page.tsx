'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'



export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  
  const { user } = useAuth()
  
  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])


  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }
    
    // 비밀번호 강도 검증
    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      setIsLoading(false)
      return
    }
    
    // 영문과 숫자 포함 검증
    if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      setError('비밀번호는 영문과 숫자를 포함해야 합니다.')
      setIsLoading(false)
      return
    }
    

    
    try {
      const response = await fetch('/api/auth/signup-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone || undefined
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setSuccess(result.message)
        // 이메일 확인이 필요한 경우 더 긴 시간 대기
        const redirectDelay = result.requiresEmailConfirmation ? 5000 : 3000
        setTimeout(() => {
          router.push('/login')
        }, redirectDelay)
      } else {
        setError(result.error || '가입 요청에 실패했습니다.')
      }
    } catch (error) {
      setError('가입 요청 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('') // 입력 시 에러 메시지 제거
  }
  
  const isFormValid = () => {
    return (
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.name &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= 8 &&
      /^(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* 로고 및 제목 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white font-bold">교</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">가입 요청</h1>
          <p className="text-gray-600">청년부 커뮤니티 가입을 요청하세요</p>
        </div>
        
        {/* 회원가입 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이메일 입력 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일 주소 *
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full"
              />
            </div>
            
            {/* 이름 입력 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                이름 *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="홍길동"
                required
                className="w-full"
              />
            </div>
            
            {/* 전화번호 입력 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                전화번호
              </label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="010-1234-5678"
                className="w-full"
              />
            </div>
            

            
            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 *
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                최소 8자 이상, 영문/숫자/특수문자 조합 권장
              </p>
            </div>
            
            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인 *
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className="flex items-center gap-2 mt-1">
                  {formData.password === formData.confirmPassword ? (
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-xs ${
                    formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formData.password === formData.confirmPassword ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
                  </span>
                </div>
              )}
            </div>
            
            {/* 에러 메시지 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
              >
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
            
            {/* 성공 메시지 */}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700"
              >
                <CheckIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </motion.div>
            )}
            
            {/* 가입 요청 버튼 */}
            <Button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="w-full h-12 text-lg font-medium"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  요청 중...
                </div>
              ) : (
                '가입 요청'
              )}
            </Button>
          </form>
          
          {/* 추가 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-primary hover:text-primary-dark font-medium"
              >
                로그인
              </button>
            </p>
          </div>
        </div>
        
        {/* 보안 정보 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 모든 데이터는 암호화되어 안전하게 보호됩니다
          </p>
        </div>
      </motion.div>
    </div>
  )
}
