import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/navigation/Header'
import Footer from '@/components/navigation/Footer'
import ChatBot from '@/components/chat/ChatBot'

export const metadata: Metadata = {
  title: 'PrayGround - 교회 청년부를 위한 올인원 플랫폼',
  description: '공지사항, 일정관리, 소통까지 모든 것을 하나로 통합한 청년부 커뮤니티 플랫폼입니다.',
  keywords: ['교회', '청년부', '커뮤니티', '공지사항', '일정관리', '소통'],
  authors: [{ name: '잠실중앙교회 개발팀' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PrayGround'
  },
  formatDetection: {
    telephone: false
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
  userScalable: false,
  viewportFit: 'cover'
}

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-secondary-100 flex flex-col">
          <Header />
          <main className="pt-16 lg:pt-20 flex-1">
            {children}
          </main>
          <Footer />
          <ChatBot />
        </div>
      </body>
    </html>
  )
}
