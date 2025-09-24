'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartIcon, ChatBubbleLeftIcon, EyeIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { Post } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface PosterCarouselProps {
  onPostClick?: (post: Post) => void
}

export default function PosterCarousel({ onPostClick }: PosterCarouselProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // 인기 게시글 데이터 가져오기
  useEffect(() => {
    const fetchPopularPosts = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/posts/popular')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        console.log('인기 게시글 API 응답:', data)
        
        if (data.success && Array.isArray(data.data)) {
          setPosts(data.data)
          console.log('인기 게시글 로드 성공:', data.data.length, '개')
        } else if (Array.isArray(data)) {
          // 이전 형식 호환성
          setPosts(data)
        } else {
          console.error('예상치 못한 응답 형식:', data)
          setError('데이터를 불러오는데 실패했습니다.')
        }
      } catch (error) {
        console.error('인기 게시글 조회 오류:', error)
        setError('인기 게시글을 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPopularPosts()
  }, [])

  // 자동 슬라이드
  useEffect(() => {
    if (posts.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [posts.length])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % posts.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length)
  }

  const handlePostClick = (post: Post) => {
    console.log('포스터 클릭:', post.id, post.title)
    // 게시글 상세페이지로 직접 이동
    router.push(`/board/${post.id}`)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'notice': return '#e74c3c'
      case 'free': return '#3498db'
      case 'qna': return '#27ae60'
      default: return '#ff6b35'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'notice': return '공지사항'
      case 'free': return '자유게시판'
      case 'qna': return 'Q&A'
      default: return category
    }
  }

  if (isLoading) {
    return (
      <div className="relative w-full h-96 bg-gray-900 rounded-xl overflow-hidden">
        <LoadingSpinner 
          message="인기 게시글을 불러오는 중..."
          size="sm"
          className="h-full"
        />
      </div>
    )
  }

  if (error || posts.length === 0) {
    return (
      <div className="relative w-full h-96 bg-gray-900 rounded-xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg">{error || '인기 게시글이 없습니다.'}</p>
          </div>
        </div>
      </div>
    )
  }

  const currentPost = posts[currentIndex]
  if (!currentPost) {
    return null
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* 메인 캐러셀 영역 */}
      <div className="relative h-96 bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => handlePostClick(currentPost)}
          >
            {/* 배경 그라데이션 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-70" />
            
            {/* 포스터 영역 (왼쪽) */}
            <div className="absolute left-4 top-4 bottom-4 w-40 sm:w-48 flex items-center">
              <div 
                className="w-full h-full rounded-lg shadow-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl"
                style={{
                  background: `linear-gradient(135deg, ${getCategoryColor(currentPost.category)}, ${getCategoryColor(currentPost.category)}dd)`
                }}
              >
                <span className="text-center px-2">{getCategoryLabel(currentPost.category)}</span>
              </div>
            </div>

            {/* 콘텐츠 영역 (오른쪽) */}
            <div className="absolute left-44 sm:left-56 right-4 top-4 bottom-4 flex flex-col text-white overflow-hidden">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="h-full flex flex-col justify-between py-4"
              >
                {/* 상단: 카테고리 태그 */}
                <div className="flex items-center gap-2">
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: getCategoryColor(currentPost.category),
                      color: '#fff'
                    }}
                  >
                    {getCategoryLabel(currentPost.category)}
                  </span>
                  {currentPost.isAnonymous && (
                    <span className="px-3 py-1 bg-gray-600 text-white rounded-full text-sm">
                      익명
                    </span>
                  )}
                </div>

                {/* 중간: 제목과 내용 */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* 제목 */}
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight break-words">
                    {currentPost.title}
                  </h2>

                  {/* 내용 미리보기 */}
                  <p className="text-sm sm:text-base lg:text-lg text-gray-300 mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 leading-relaxed break-words">
                    {currentPost.content}
                  </p>
                </div>

                {/* 하단: 작성자, 통계, 버튼 */}
                <div className="space-y-4">
                  {/* 작성자 정보 */}
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {currentPost.isAnonymous ? '익' : (currentPost.author?.name?.[0] || '?')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {currentPost.isAnonymous ? '익명' : (currentPost.author?.name || '알 수 없음')}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {new Date(currentPost.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>

                  {/* 통계 정보 */}
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {currentPost.userLiked ? (
                        <HeartSolidIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                      )}
                      <span className="text-sm sm:text-lg font-medium">{currentPost.likeCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <ChatBubbleLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      <span className="text-sm sm:text-lg font-medium">{currentPost.commentCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                      <span className="text-sm sm:text-lg font-medium">{currentPost.viewCount || 0}</span>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <button 
                    className="bg-orange-500 hover:bg-red-500 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base lg:text-lg transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg w-full sm:w-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePostClick(currentPost)
                    }}
                  >
                    게시글 보기
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 네비게이션 화살표 */}
        {posts.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                prevSlide()
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-10"
            >
              <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                nextSlide()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-10"
            >
              <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            </button>
          </>
        )}

        {/* 인디케이터 도트 */}
        {posts.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {posts.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex(index)
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-orange-500 scale-125' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
