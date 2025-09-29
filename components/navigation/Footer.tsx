'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  HeartIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'

const footerNavigation = {
  main: [
    { name: '홈', href: '/' },
    { name: '게시판', href: '/board' },
    { name: '캘린더', href: '/calendar' },
    { name: '내정보', href: '/profile' },
  ],
}

const socialLinks = [
  {
    name: '카카오톡',
    href: '#',
    icon: '💬',
  },
  {
    name: '인스타그램',
    href: '#',
    icon: '📷',
  },
  {
    name: '유튜브',
    href: '#',
    icon: '📺',
  },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-wide">
        {/* 메인 푸터 콘텐츠 */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 브랜드 섹션 */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-church-purple to-church-teal rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">청</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-church-purple to-church-teal bg-clip-text text-transparent">
                  청년부 커뮤니티
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                교회 청년부를 위한 올인원 커뮤니티 플랫폼입니다. 
                공지사항, 일정관리, 소통까지 모든 것을 하나로 통합했습니다.
              </p>
              
              {/* 소셜 링크 */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-lg hover:bg-church-purple transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title={social.name}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>

            {/* 주요 링크 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">주요 서비스</h3>
              <ul className="space-y-3">
                {footerNavigation.main.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2"
                    >
                      {item.name === '홈' && <span className="w-4 h-4">🏠</span>}
                      {item.name === '게시판' && <DocumentTextIcon className="w-4 h-4" />}
                      {item.name === '캘린더' && <CalendarIcon className="w-4 h-4" />}
                      {item.name === '내정보' && <UserCircleIcon className="w-4 h-4" />}
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 하단 구분선 */}
        <div className="border-t border-gray-800">
          <div className="py-6 md:py-8">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              {/* 저작권 */}
              <div className="text-center md:text-left">
                <p className="text-gray-400 text-sm">
                  © {currentYear} 청년부 커뮤니티. 모든 권리 보유.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Made with <HeartIcon className="inline w-3 h-3 text-red-500" /> for the church
                </p>
              </div>

              {/* 추가 정보 */}
              <div className="text-center md:text-right">
                <p className="text-gray-400 text-sm">
                  버전 1.0.0 • Next.js 14 • Supabase
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  최신 업데이트: {new Date().toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
