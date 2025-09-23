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

    // 즉시 UI 업데이트 (낙관적 업데이트)
    const newIsLiked = !isLiked
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1
    
    setLikeCount(newLikeCount)
    setIsLiked(newIsLiked)
    onLikeChange?.(newLikeCount, newIsLiked)
    
    setIsLoading(true)
    
    try {
      // 현재 세션에서 액세스 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('로그인이 필요합니다.')
        // 실패 시 UI 롤백
        setLikeCount(likeCount)
        setIsLiked(isLiked)
        onLikeChange?.(likeCount, isLiked)
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
        // 서버에서 반환된 정확한 값으로 최종 업데이트
        const finalLikeCount = data.likeCount || newLikeCount
        const finalIsLiked = data.liked !== undefined ? data.liked : newIsLiked

        setLikeCount(finalLikeCount)
        setIsLiked(finalIsLiked)
        onLikeChange?.(finalLikeCount, finalIsLiked)
      } else {
        console.error('좋아요 처리 실패:', data.error)
        // 실패 시 UI 롤백
        setLikeCount(likeCount)
        setIsLiked(isLiked)
        onLikeChange?.(likeCount, isLiked)
        alert(`좋아요 처리 실패: ${data.error}`)
      }
    } catch (error) {
      console.error('좋아요 요청 실패:', error)
      // 실패 시 UI 롤백
      setLikeCount(likeCount)
      setIsLiked(isLiked)
      onLikeChange?.(likeCount, isLiked)
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