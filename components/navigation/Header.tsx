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
import { Button } from '@/components/ui/Button'
import { usePWA } from '@/hooks/usePWA'
import { useAuth } from '@/hooks/useAuth'
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
        : 'bg-transparent'
    }`}>
      <div className="container-wide">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-autumn rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg lg:text-xl">PG</span>
            </div>
            <span className="text-xl lg:text-2xl font-bold bg-gradient-autumn bg-clip-text text-transparent">
              PrayGround
            </span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-autumn-coral/20 text-autumn-coral'
                      : 'text-gray-600 hover:text-autumn-coral hover:bg-autumn-peach/30'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* 우측 액션 버튼들 */}
          <div className="flex items-center space-x-4">
            {/* 로그인 상태에 따른 버튼 */}
            {!isLoading && (
              <>
                {user ? (
                  /* 로그인된 경우 - 내정보 버튼과 로그아웃 버튼 */
                  <div className="flex items-center space-x-2">
                    <Link href="/profile">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hidden sm:flex"
                        title="내정보"
                      >
                        <UserCircleIcon className="w-6 h-6" />
                      </Button>
                    </Link>
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      size="icon"
                      className="hidden sm:flex text-gray-600 hover:text-red-600"
                      title="로그아웃"
                    >
                      <ArrowRightOnRectangleIcon className="w-6 h-6" />
                    </Button>
                  </div>
                ) : (
                  /* 로그인되지 않은 경우 - 로그인 버튼 */
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    variant="outline"
                    className="hidden sm:flex border-autumn-coral text-autumn-coral hover:bg-autumn-coral hover:text-white"
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
              className="lg:hidden"
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

      {/* 모바일 메뉴 */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-200"
          >
            <div className="container-wide py-4">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-autumn-coral/20 text-autumn-coral'
                          : 'text-gray-600 hover:text-autumn-coral hover:bg-autumn-peach/30'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )
                })}
                
                {/* 모바일 로그인 상태에 따른 버튼 */}
                {user ? (
                  /* 로그인된 경우 - 내정보 버튼과 로그아웃 버튼 */
                  <>
                    <Link
                      href="/profile"
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        pathname === '/profile'
                          ? 'bg-autumn-coral/20 text-autumn-coral'
                          : 'text-gray-600 hover:text-autumn-coral hover:bg-autumn-peach/30'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      <span className="font-medium">내정보</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        closeMobileMenu()
                      }}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-600 hover:text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      <span className="font-medium">로그아웃</span>
                    </button>
                  </>
                ) : (
                  /* 로그인되지 않은 경우 - 로그인 버튼 */
                  <button
                    onClick={() => {
                      setShowAuthModal(true)
                      closeMobileMenu()
                    }}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-600 hover:text-autumn-coral hover:bg-autumn-peach/30 w-full text-left"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span className="font-medium">로그인</span>
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
