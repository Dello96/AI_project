'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import PostDetail from '@/components/board/PostDetail'
import { Post } from '@/types'
import { postService } from '@/lib/database'
import { Button } from '@/components/ui/Button'

function PostDetailContent() {
  const router = useRouter()
  const params = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const postId = params.id as string

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return

      try {
        setIsLoading(true)
        setError(null)
        
        console.log('게시글 상세 조회 시작:', postId)
        const fetchedPost = await postService.getPost(postId)
        
        if (fetchedPost) {
          console.log('게시글 조회 성공:', fetchedPost)
          setPost(fetchedPost)
        } else {
          console.log('게시글을 찾을 수 없음')
          setError('게시글을 찾을 수 없습니다.')
        }
      } catch (error) {
        console.error('게시글 조회 오류:', error)
        setError('게시글을 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  const handleBack = () => {
    router.push('/board')
  }

  const handleEdit = (post: Post) => {
    router.push(`/board/write?edit=${post.id}`)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return

    try {
      const result = await postService.deletePost(postId)
      if (result) {
        router.push('/board')
      }
    } catch (error) {
      console.error('게시글 삭제 오류:', error)
      alert('게시글 삭제에 실패했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-6">
          {/* 로딩 메시지 - 상단으로 이동 */}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white mb-2">
              잠시만 기다려주세요
            </h2>
            <p className="text-gray-400 text-lg">
              게시글을 불러오는 중입니다...
            </p>
          </div>
          
          {/* 메인 로딩 애니메이션 */}
          <div className="relative">
            {/* 단일 링 */}
            <div className="w-24 h-24 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
            
            {/* 중앙 점 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* 점 애니메이션 */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          {/* 극장 스타일 장식 요소 */}
          <div className="flex justify-center space-x-4 mt-6">
            <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
            <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
            <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '800ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
            <ArrowLeftIcon className="w-12 h-12 text-gray-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">{error || '게시글을 찾을 수 없습니다'}</h2>
            <p className="text-gray-400 text-lg mb-8">
              요청하신 게시글이 존재하지 않거나 삭제되었습니다.
            </p>
            <Button
              onClick={handleBack}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-lg font-semibold text-lg"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              게시판으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section - 인터파크 극장 스타일 */}
      <section className="relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800" />
        
        <div className="relative z-10 container mx-auto px-6 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            {/* 메인 타이틀 */}
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-orange-500 to-red-500 bg-clip-text text-transparent">
              게시글
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              청년부 소식과 이야기를 <span className="text-orange-500 font-semibold">자세히 살펴보세요</span>
            </p>
          </motion.div>

          {/* 뒤로가기 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex justify-center mb-16"
          >
            <Button 
              onClick={handleBack}
              className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl"
              size="lg"
            >
              <ArrowLeftIcon className="w-6 h-6 mr-3" />
              게시판으로 돌아가기
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 게시글 상세 콘텐츠 */}
      <div className="relative z-10 container mx-auto px-6 pb-16 max-w-6xl">
        <PostDetail
          post={post}
          onBack={handleBack}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}

export default function PostDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-6">
          {/* 로딩 메시지 - 상단으로 이동 */}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white mb-2">
              잠시만 기다려주세요
            </h2>
            <p className="text-gray-400 text-lg">
              게시글을 불러오는 중입니다...
            </p>
          </div>
          
          {/* 메인 로딩 애니메이션 */}
          <div className="relative">
            {/* 단일 링 */}
            <div className="w-24 h-24 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
            
            {/* 중앙 점 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* 점 애니메이션 */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          {/* 극장 스타일 장식 요소 */}
          <div className="flex justify-center space-x-4 mt-6">
            <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
            <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
            <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '800ms' }}></div>
          </div>
        </div>
      </div>
    }>
      <PostDetailContent />
    </Suspense>
  )
}
