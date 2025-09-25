'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Bars3Icon, 
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  HomeIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import Logo from '@/components/ui/Logo'
import { usePWA } from '@/hooks/usePWA'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/auth/AuthModal'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: '홈', href: '/', icon: HomeIcon },
  { name: '게시판', href: '/board', icon: DocumentTextIcon },
  { name: '캘린더', href: '/calendar', icon: CalendarIcon },
]

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const pathname = usePathname()
  const { notificationPermission } = usePWA()
  const { user, isLoading, signOut } = useAuth()

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 모바일 메뉴 닫기
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await signOut()
      // 로그아웃 후 홈페이지로 리다이렉트
      window.location.href = '/'
    } catch (error) {
      console.error('로그아웃 오류:', error)
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }


  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-black/95 backdrop-blur-md shadow-2xl border-b border-orange-500/30' 
        : 'bg-gradient-to-r from-black/80 via-gray-900/80 to-black/80 backdrop-blur-sm'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* 로고 - 기존 PNG 파일 사용 */}
          <Link href="/" className="group">
            <div className="flex items-center space-x-3">
              <div className="group-hover:scale-110 transition-transform duration-300">
                <Image
                  src="/images/logo/logo.png"
                  alt="PrayGround 로고"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-orange-400 bg-clip-text text-transparent">
                  PrayGround
                </h1>
                <p className="text-xs text-gray-400 -mt-1">Youth Community</p>
              </div>
            </div>
          </Link>

          {/* 데스크톱 네비게이션 - 극장 스타일 */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 font-medium ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-white/10 hover:transform hover:scale-105'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* 우측 액션 버튼들 - 극장 스타일 */}
          <div className="flex items-center space-x-3">
            {/* 로그인 상태에 따른 버튼 */}
            {!isLoading && (
              <>
                {user ? (
                  /* 로그인된 경우 */
                  <div className="flex items-center space-x-2">
                    <Link href="/profile">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hidden sm:flex text-gray-300 hover:text-orange-400 hover:bg-white/10 transition-all duration-300"
                        title="내정보"
                      >
                        <UserCircleIcon className="w-6 h-6" />
                      </Button>
                    </Link>
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      size="icon"
                      className="hidden sm:flex text-gray-300 hover:text-red-400 hover:bg-white/10 transition-all duration-300"
                      title="로그아웃"
                    >
                      <ArrowRightOnRectangleIcon className="w-6 h-6" />
                    </Button>
                  </div>
                ) : (
                  /* 로그인되지 않은 경우 */
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    className="hidden sm:flex bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none px-6 py-2 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    로그인
                  </Button>
                )}
              </>
            )}

            {/* 모바일 메뉴 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-300 hover:text-orange-400 hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 - 다크 테마 */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-gradient-to-br from-gray-900 to-black border-t border-orange-500/30 shadow-xl"
          >
            <div className="container mx-auto px-6 py-6">
              <nav className="space-y-3">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-4 rounded-lg transition-all duration-300 font-medium ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                
                {/* 구분선 */}
                <div className="border-t border-gray-700 my-4"></div>
                
                {/* 모바일 로그인 상태에 따른 버튼 */}
                {user ? (
                  /* 로그인된 경우 */
                  <>
                    <Link
                      href="/profile"
                      className={`flex items-center space-x-3 px-4 py-4 rounded-lg transition-all duration-300 font-medium ${
                        pathname === '/profile'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      <span>내정보</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        closeMobileMenu()
                      }}
                      className="flex items-center space-x-3 px-4 py-4 rounded-lg transition-all duration-300 text-gray-300 hover:text-red-400 hover:bg-red-500/10 w-full text-left font-medium"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      <span>로그아웃</span>
                    </button>
                  </>
                ) : (
                  /* 로그인되지 않은 경우 */
                  <button
                    onClick={() => {
                      setShowAuthModal(true)
                      closeMobileMenu()
                    }}
                    className="flex items-center space-x-3 px-4 py-4 rounded-lg transition-all duration-300 bg-gradient-to-r from-orange-500 to-red-500 text-white w-full text-left font-medium hover:from-orange-600 hover:to-red-600"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span>로그인</span>
                  </button>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 인증 모달 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signin"
      />
    </header>
  )
}
