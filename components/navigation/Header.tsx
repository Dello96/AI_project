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
import { useAuth } from '@/hooks/useAuth'
import { usePWA } from '@/hooks/usePWA'

const navigation = [
  { name: '홈', href: '/', icon: HomeIcon },
  { name: '게시판', href: '/board', icon: DocumentTextIcon },
  { name: '캘린더', href: '/calendar', icon: CalendarIcon },
  { name: '채팅', href: '/chat', icon: ChatBubbleLeftRightIcon },
]

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { notificationPermission } = usePWA()

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

  // 로그아웃
  const handleSignOut = async () => {
    await signOut()
    closeMobileMenu()
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
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-church-purple to-church-teal rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg lg:text-xl">청</span>
            </div>
            <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-church-purple to-church-teal bg-clip-text text-transparent">
              청년부 커뮤니티
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
                      ? 'bg-church-purple/10 text-church-purple'
                      : 'text-gray-600 hover:text-church-purple hover:bg-gray-50'
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
            {/* 알림 버튼 */}
            {user && (
              <Link href="/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                >
                  <BellIcon className="w-5 h-5" />
                  {notificationPermission === 'denied' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"
                    />
                  )}
                </Button>
              </Link>
            )}

            {/* 사용자 메뉴 */}
            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span className="hidden sm:block">{user.name || user.email}</span>
                </Button>

                {/* 사용자 드롭다운 메뉴 */}
                <AnimatePresence>
                  {isMobileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                    >
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={closeMobileMenu}
                      >
                        프로필 설정
                      </Link>
                      <Link
                        href="/notifications/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={closeMobileMenu}
                      >
                        알림 설정
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={closeMobileMenu}
                        >
                          관리자
                        </Link>
                      )}
                      <hr className="my-2" />
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        로그아웃
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/auth">
                <Button variant="church" size="sm">
                  로그인
                </Button>
              </Link>
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
                          ? 'bg-church-purple/10 text-church-purple'
                          : 'text-gray-600 hover:text-church-purple hover:bg-gray-50'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )
                })}
              </nav>

              {user && (
                <>
                  <hr className="my-4" />
                  <div className="space-y-2">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-church-purple hover:bg-gray-50 rounded-lg"
                      onClick={closeMobileMenu}
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      <span>프로필 설정</span>
                    </Link>
                    <Link
                      href="/notifications/settings"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-church-purple hover:bg-gray-50 rounded-lg"
                      onClick={closeMobileMenu}
                    >
                      <BellIcon className="w-5 h-5" />
                      <span>알림 설정</span>
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-church-purple hover:bg-gray-50 rounded-lg"
                        onClick={closeMobileMenu}
                      >
                        <span className="w-5 h-5 flex items-center justify-center">⚙️</span>
                        <span>관리자</span>
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
