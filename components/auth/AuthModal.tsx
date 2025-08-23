'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SignupForm, LoginForm } from '@/types'
import { churchDomainService } from '@/lib/database'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup'
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode)
  const [showPassword, setShowPassword] = useState(false)
  const [signUpData, setSignUpData] = useState<SignupForm>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    churchDomain: ''
  })
  const [signInData, setSignInData] = useState<LoginForm>({
    email: '',
    password: ''
  })
  
  const [churchDomains, setChurchDomains] = useState<{ id: string; domain: string; name: string }[]>([])
  const [showDomainDropdown, setShowDomainDropdown] = useState(false)
  
  const { signIn, signUp, isLoading, error } = useAuth()

  // 교회 도메인 데이터 로딩
  useEffect(() => {
    const loadChurchDomains = async () => {
      try {
        const domains = await churchDomainService.getDomains()
        setChurchDomains(domains)
      } catch (error) {
        console.error('교회 도메인 로딩 오류:', error)
      }
    }
    
    if (mode === 'signup') {
      loadChurchDomains()
    }
  }, [mode])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.domain-dropdown')) {
        setShowDomainDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'signin') {
      const result = await signIn(signInData)
      if (result.success) {
        onClose()
      }
    } else {
      const result = await signUp(signUpData)
      if (result.success) {
        setMode('signin')
        setSignUpData({ email: '', password: '', confirmPassword: '', name: '', phone: '', churchDomain: '' })
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
    setSignUpData({ email: '', password: '', confirmPassword: '', name: '', phone: '', churchDomain: '' })
    setSignInData({ email: '', password: '' })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
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
                <div className="relative domain-dropdown">
                  <button
                    type="button"
                    onClick={() => setShowDomainDropdown(!showDomainDropdown)}
                    className="flex w-full items-center justify-between rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 border-neutral-200 focus:border-primary-500 focus:ring-primary-100 h-12"
                  >
                    <span className={signUpData.churchDomain ? 'text-foreground' : 'text-muted-foreground'}>
                      {signUpData.churchDomain || '교회 도메인을 선택하세요'}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                  </button>
                  
                  {showDomainDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-input rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {churchDomains.map((domain) => (
                        <button
                          key={domain.id}
                          type="button"
                          onClick={() => {
                            handleInputChange('churchDomain', domain.domain)
                            setShowDomainDropdown(false)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                        >
                          <div className="font-medium">{domain.name}</div>
                          <div className="text-sm text-muted-foreground">{domain.domain}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
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
