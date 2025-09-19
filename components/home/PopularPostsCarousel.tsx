'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HeartIcon, EyeIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/components/ui/Card'
import Carousel from '@/components/ui/Carousel'
import { Post } from '@/types'

interface PopularPostsCarouselProps {
  onPostClick: (post: Post) => void
}

export default function PopularPostsCarousel({ onPostClick }: PopularPostsCarouselProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 인기 게시글 조회
  const fetchPopularPosts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/posts/popular')
      const result = await response.json()
      
      if (response.ok && result.success) {
        setPosts(result.data)
      } else {
        setError(result.error || '인기 게시글을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('인기 게시글 조회 오류:', error)
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

  if (error || posts.length === 0) {
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🔥 인기 게시글</h2>
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
            className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
            onClick={() => onPostClick(post)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[post.category]}`}>
                    {categoryLabels[post.category]}
                  </span>
                  {post.isAnonymous && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      익명
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <HeartIcon className="w-4 h-4 text-red-500" />
                  <span className="font-medium">{post.likeCount}</span>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                {post.title}
              </h3>
              
              <p className="text-gray-600 mb-4 line-clamp-3">
                {post.content}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {post.isAnonymous ? '익명' : post.author?.name || '알 수 없음'}
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <EyeIcon className="w-4 h-4" />
                    <span>{post.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ChatBubbleLeftIcon className="w-4 h-4" />
                    <span>{post.commentCount}</span>
                  </div>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </Carousel>
    </div>
  )
}
