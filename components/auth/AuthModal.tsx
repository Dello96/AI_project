'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SignupForm, LoginForm } from '@/types'
import KakaoLoginButton from './KakaoLoginButton'


interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup'
  onSuccess?: () => void
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'signin', onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode)
  const [showPassword, setShowPassword] = useState(false)
  const [signUpData, setSignUpData] = useState<SignupForm>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  })
  const [signInData, setSignInData] = useState<LoginForm>({
    email: '',
    password: ''
  })
  const [error, setError] = useState<string | null>(null)
  
  const { signIn, signUp, isLoading, error: authError } = useAuth()





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null) // 이전 에러 메시지 초기화
    
    if (mode === 'signin') {
      const result = await signIn(signInData)
      if (result.success) {
        onClose()
        onSuccess?.()
      } else {
        setError(result.message || '로그인에 실패했습니다.')
      }
    } else {
      const result = await signUp(signUpData)
      if (result.success) {
        setMode('signin')
        setSignUpData({ email: '', password: '', confirmPassword: '', name: '', phone: '' })
        setError(null)
      } else {
        setError(result.message || '회원가입에 실패했습니다.')
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (mode === 'signup') {
      setSignUpData((prev: SignupForm) => ({ ...prev, [field]: value }))
    } else {
      setSignInData((prev: LoginForm) => ({ ...prev, [field]: value }))
    }
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setSignUpData({ email: '', password: '', confirmPassword: '', name: '', phone: '' })
    setSignInData({ email: '', password: '' })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
          style={{
            position: 'relative',
            margin: 'auto',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-900">
              {mode === 'signin' ? '로그인' : '회원가입'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <Input
                  type="text"
                  placeholder="이름"
                  value={signUpData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
                <Input
                  type="tel"
                  placeholder="휴대폰 번호 (선택)"
                  value={signUpData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />

              </>
            )}

            <Input
              type="email"
              placeholder="이메일 주소"
              value={mode === 'signin' ? signInData.email : signUpData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호"
                value={mode === 'signin' ? signInData.password : signUpData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-secondary-100 rounded"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-4 h-4 text-secondary-500" />
                ) : (
                  <EyeIcon className="w-4 h-4 text-secondary-500" />
                )}
              </button>
            </div>

            {(error || authError) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error || authError}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {mode === 'signin' ? '로그인' : '회원가입'}
            </Button>
          </form>

          {/* 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* 카카오 로그인 */}
          <KakaoLoginButton
            onSuccess={() => {
              onClose()
            }}
            className="mb-4"
          />

          {/* 모드 전환 */}
          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              {mode === 'signin' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            </p>
            <button
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700 font-medium mt-1"
            >
              {mode === 'signin' ? '회원가입하기' : '로그인하기'}
            </button>
          </div>

          {/* 교회 이메일 안내 */}
          {mode === 'signup' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 교회 이메일 주소만 사용 가능합니다. (예: name@youth.church.kr)
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
