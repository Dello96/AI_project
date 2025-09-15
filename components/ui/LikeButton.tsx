'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { Button } from './Button'
import { useAuth } from '@/hooks/useAuth'

interface LikeButtonProps {
  targetType: 'post' | 'comment'
  targetId: string
  initialLiked?: boolean
  initialCount?: number
  onLikeChange?: (liked: boolean, count: number) => void
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}

export default function LikeButton({
  targetType,
  targetId,
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
  size = 'sm',
  variant = 'ghost',
  className
}: LikeButtonProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 초기 상태 로드
  useEffect(() => {
    if (user) {
      fetchLikeStatus()
    }
  }, [user, targetId])

  // 좋아요 상태 조회
  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(
        `/api/likes/status?targetType=${targetType}&targetId=${targetId}`
      )
      const result = await response.json()

      if (response.ok && result.success) {
        setLiked(result.data.liked)
        setCount(result.data.count)
      }
    } catch (error) {
      console.error('좋아요 상태 조회 오류:', error)
    }
  }

  // 좋아요 토글
  const handleToggleLike = async () => {
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (isLoading) return

    try {
      setIsLoading(true)
      setError(null)

      // 낙관적 업데이트
      const newLiked = !liked
      const newCount = newLiked ? count + 1 : count - 1
      
      setLiked(newLiked)
      setCount(newCount)
      onLikeChange?.(newLiked, newCount)

      const response = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType,
          targetId
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setLiked(result.data.liked)
        setCount(result.data.count)
        onLikeChange?.(result.data.liked, result.data.count)
      } else {
        // 실패 시 롤백
        setLiked(!newLiked)
        setCount(newLiked ? count : count + 1)
        onLikeChange?.(!newLiked, newLiked ? count : count + 1)
        setError(result.error || '좋아요 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('좋아요 토글 오류:', error)
      // 실패 시 롤백
      setLiked(!liked)
      setCount(liked ? count + 1 : count - 1)
      onLikeChange?.(!liked, liked ? count + 1 : count - 1)
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleToggleLike}
        disabled={isLoading || !user}
        className={`${className} ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
      >
        <motion.div
          animate={liked ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {liked ? (
            <HeartSolidIcon className="w-4 h-4" />
          ) : (
            <HeartIcon className="w-4 h-4" />
          )}
        </motion.div>
        {count > 0 && (
          <span className="ml-1 text-sm font-medium">
            {count}
          </span>
        )}
      </Button>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-xs text-red-500"
        >
          {error}
        </motion.div>
      )}
    </div>
  )
}
