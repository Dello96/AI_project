'use client'

import { useState } from 'react'
import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface LikeButtonProps {
  postId: string
  initialLikeCount: number
  initialIsLiked: boolean
  onLikeChange?: (likeCount: number, isLiked: boolean) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LikeButton({
  postId,
  initialLikeCount,
  initialIsLiked,
  onLikeChange,
  className,
  size = 'md'
}: LikeButtonProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isLoading, setIsLoading] = useState(false)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const handleLike = async () => {
    if (isLoading) return

    setIsLoading(true)
    
    try {
      // 현재 세션에서 액세스 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('로그인이 필요합니다.')
        alert('로그인이 필요합니다.')
        return
      }

      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        // API에서 반환된 실제 좋아요 수 사용
        const newLikeCount = data.likeCount || (isLiked ? likeCount - 1 : likeCount + 1)
        const newIsLiked = data.liked

        setLikeCount(newLikeCount)
        setIsLiked(newIsLiked)
        onLikeChange?.(newLikeCount, newIsLiked)
      } else {
        console.error('좋아요 처리 실패:', data.error)
        alert(`좋아요 처리 실패: ${data.error}`)
      }
    } catch (error) {
      console.error('좋아요 요청 실패:', error)
      alert(`좋아요 요청 실패: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.button
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        'flex items-center space-x-1 px-2 py-1 rounded-lg transition-all duration-200',
        'hover:bg-theme-light/30 focus:outline-none focus:ring-2 focus:ring-theme-primary/20',
        isLiked 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-500 hover:text-red-500',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={isLiked ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {isLiked ? (
          <HeartSolidIcon className={cn(sizeClasses[size], 'text-red-500')} />
        ) : (
          <HeartIcon className={cn(sizeClasses[size])} />
        )}
      </motion.div>
      
      <span className={cn(
        'font-medium',
        textSizeClasses[size],
        isLiked ? 'text-red-500' : 'text-gray-600'
      )}>
        {likeCount}
      </span>
    </motion.button>
  )
}