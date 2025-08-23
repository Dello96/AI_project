'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular', 
  width, 
  height, 
  lines = 1 
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 rounded animate-pulse'
  
  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${className}`}
            style={{
              width: width || '100%',
              height: height || '1rem'
            }}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.1
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'circular') {
    return (
      <motion.div
        className={`${baseClasses} ${className}`}
        style={{
          width: width || '2rem',
          height: height || '2rem',
          borderRadius: '50%'
        }}
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{
          duration: 1.5,
          repeat: Infinity
        }}
      />
    )
  }

  return (
    <motion.div
      className={`${baseClasses} ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem'
      }}
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{
        duration: 1.5,
        repeat: Infinity
      }}
    />
  )
}

// 카드 스켈레톤
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton variant="circular" width="3rem" height="3rem" />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height="1.25rem" />
          <Skeleton variant="text" width="40%" height="1rem" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
    </div>
  )
}

// 리스트 스켈레톤
export function ListSkeleton({ 
  items = 5, 
  className = '' 
}: { 
  items?: number
  className?: string 
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
          <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" height="1.125rem" />
            <Skeleton variant="text" width="50%" height="1rem" />
          </div>
          <Skeleton variant="rectangular" width="4rem" height="2rem" />
        </div>
      ))}
    </div>
  )
}

// 테이블 스켈레톤
export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}: { 
  rows?: number
  columns?: number
  className?: string 
}) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* 헤더 */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-6">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} variant="text" width="6rem" height="1.125rem" />
          ))}
        </div>
      </div>
      
      {/* 행들 */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-6">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} variant="text" width="8rem" height="1rem" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 프로필 스켈레톤
export function ProfileSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="text-center">
        <Skeleton variant="circular" width="6rem" height="6rem" className="mx-auto mb-4" />
        <Skeleton variant="text" width="40%" height="1.5rem" className="mx-auto mb-2" />
        <Skeleton variant="text" width="60%" height="1rem" className="mx-auto mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <Skeleton variant="text" width="3rem" height="1.5rem" className="mx-auto mb-1" />
            <Skeleton variant="text" width="5rem" height="1rem" className="mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton variant="text" width="3rem" height="1.5rem" className="mx-auto mb-1" />
            <Skeleton variant="text" width="5rem" height="1rem" className="mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton variant="text" width="3rem" height="1.5rem" className="mx-auto mb-1" />
            <Skeleton variant="text" width="5rem" height="1rem" className="mx-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
