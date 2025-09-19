'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { HeartIcon, EyeIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/components/ui/Card'
import Carousel from '@/components/ui/Carousel'
import { Post } from '@/types'

interface PopularPostsCarouselProps {
  onPostClick: (post: Post) => void
}

export default function PopularPostsCarousel({ onPostClick }: PopularPostsCarouselProps) {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 인기 게시글 조회
  const fetchPopularPosts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔥 인기 게시글 조회 시작')
      
      const response = await fetch('/api/posts/popular')
      console.log('🔥 API 응답 상태:', response.status, response.statusText)
      
      if (!response.ok) {
        console.error('🔥 API 응답 오류:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('🔥 오류 응답 본문:', errorText)
        setError(`API 오류: ${response.status} ${response.statusText}`)
        return
      }
      
      const result = await response.json()
      console.log('🔥 인기 게시글 API 응답:', { response: response.status, result })
      
      if (result.success) {
        setPosts(result.data || [])
        console.log('🔥 인기 게시글 조회 성공:', result.data)
      } else {
        const errorMsg = result.error || '인기 게시글을 불러오는데 실패했습니다.'
        console.error('🔥 인기 게시글 조회 실패:', errorMsg)
        setError(errorMsg)
      }
    } catch (error) {
      console.error('🔥 인기 게시글 조회 오류:', error)
      console.error('🔥 오류 상세:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      setError('인기 게시글을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPopularPosts()
  }, [])

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
        <div className="text-gray-500">인기 게시글을 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-64 bg-red-50 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">인기 게시글을 불러올 수 없습니다</div>
          <div className="text-sm text-red-400 mb-4">{error}</div>
          <button 
            onClick={fetchPopularPosts}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-50 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">인기 게시글이 없습니다</div>
          <div className="text-sm text-gray-400">게시글에 좋아요를 눌러보세요!</div>
        </div>
      </div>
    )
  }

  const categoryColors = {
    notice: 'bg-red-100 text-red-600',
    free: 'bg-blue-100 text-blue-600',
    qna: 'bg-green-100 text-green-600'
  }

  const categoryLabels = {
    notice: '공지사항',
    free: '자유게시판',
    qna: 'Q&A'
  }

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <span className="text-3xl">🔥</span>
          인기 게시글
        </h2>
        <p className="text-gray-600">가장 많은 좋아요를 받은 게시글들을 확인해보세요</p>
      </div>
      
      <Carousel
        autoPlay={true}
        autoPlayInterval={4000}
        showDots={true}
        showArrows={true}
        className="max-w-4xl mx-auto"
      >
        {posts.map((post) => (
          <Card 
            key={post.id}
            className="cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-gray-300"
            onClick={() => {
              // 게시글 클릭 시 바로 게시판 페이지로 이동
              console.log('인기 게시글 클릭:', post.id)
              // URL 파라미터와 함께 게시판 페이지로 이동
              const url = `/board?postId=${post.id}`
              console.log('이동할 URL:', url)
              router.push(url)
            }}
          >
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${categoryColors[post.category]}`}>
                    {categoryLabels[post.category]}
                  </span>
                  {post.isAnonymous && (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      익명
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <HeartIcon className="w-4 h-4 text-red-500" />
                  <span className="font-medium">{post.likeCount}</span>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4 line-clamp-2 leading-tight">
                {post.title}
              </h3>
              
              <p className="text-gray-600 mb-5 line-clamp-3 leading-relaxed">
                {post.content}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
                <span className="font-medium text-gray-700">
                  {post.isAnonymous ? '익명' : post.author?.name || '알 수 없음'}
                </span>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <EyeIcon className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{post.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChatBubbleLeftIcon className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{post.commentCount}</span>
                  </div>
                  <span className="text-gray-400 font-medium">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </Carousel>
    </div>
  )
}
