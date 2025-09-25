'use client'

import { motion } from 'framer-motion'

interface ChurchLocationCardProps {
  className?: string
}

export default function ChurchLocationCard({ className = '' }: ChurchLocationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative ${className}`}
    >
      {/* 지도 대신 교회 정보 카드 */}
      <div className="w-full h-80 rounded-lg shadow-lg overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
        <div className="h-full flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">잠실중앙교회</h3>
            <p className="text-lg text-gray-600 mb-2">서울특별시 송파구 올림픽로35길 118</p>
            <p className="text-gray-500 mb-6">잠실중앙교회장로회</p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>📞 02-423-5303</span>
              <span>•</span>
              <span>🚇 잠실역 도보 5분</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 교회 정보 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-4 bg-white rounded-lg shadow-md p-4"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">잠실중앙교회</h3>
            <p className="text-gray-600 text-sm mb-2">서울특별시 송파구 올림픽로35길 118</p>
            <p className="text-gray-500 text-sm">📞 02-423-5303</p>
            <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              💡 지도 기능은 API 키 설정 후 활성화됩니다
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
