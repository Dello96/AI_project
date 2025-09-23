'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'
import BoardList from '@/components/board/BoardList'
import PostForm from '@/components/board/PostForm'
import PostDetail from '@/components/board/PostDetail'
import { Post } from '@/types'
import { postService } from '@/lib/database'
import { Button } from '@/components/ui/Button'
function BoardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [view, setView] = useState<'list' | 'write' | 'detail'>('list')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  const handleWritePost = () => {
    setView('write')
  }

  const handleSelectPost = (post: Post) => {
    setSelectedPost(post)
    setView('detail')
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setView('write')
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return

    try {
      const result = await postService.deletePost(postId)
      if (result) {
        setView('list')
        setSelectedPost(null)
      }
    } catch (error) {
      console.error('게시글 삭제 오류:', error)
      alert('게시글 삭제에 실패했습니다.')
    }
  }

  const handlePostSuccess = () => {
    setView('list')
    setEditingPost(null)
  }

  // URL 파라미터에서 게시글 ID 확인
  useEffect(() => {
    const postId = searchParams.get('postId')
    console.log('📋 게시판 페이지 - URL 파라미터 확인:', { postId, searchParams: searchParams.toString() })
    
    if (postId) {
      console.log('📋 게시글 ID 발견, 게시글 조회 시작:', postId)
      // 게시글 ID가 있으면 해당 게시글을 조회하고 상세 페이지로 이동
      const fetchPost = async () => {
        try {
          console.log('📋 postService.getPost 호출:', postId)
          const post = await postService.getPost(postId)
          console.log('📋 게시글 조회 결과:', post)
          
          if (post) {
            console.log('📋 게시글 조회 성공, 상세 페이지로 이동')
            setSelectedPost(post)
            setView('detail')
          } else {
            console.log('📋 게시글을 찾을 수 없음')
            // 게시글을 찾을 수 없으면 목록으로 돌아가기
            setView('list')
            setSelectedPost(null)
          }
        } catch (error) {
          console.error('📋 게시글 조회 오류:', error)
          console.error('📋 오류 상세:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          })
          // 오류 발생 시 목록으로 돌아가기
          setView('list')
          setSelectedPost(null)
        }
      }
      fetchPost()
    } else {
      console.log('📋 postId 파라미터가 없음, 목록 뷰 유지')
      // postId가 없으면 목록 뷰로 설정
      setView('list')
      setSelectedPost(null)
    }
  }, [searchParams])

  const handleBackToList = () => {
    setView('list')
    setSelectedPost(null)
    setEditingPost(null)
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
              게시판
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              청년부 소식과 이야기를 <span className="text-orange-500 font-semibold">나누어보세요</span>
            </p>
          </motion.div>

          {/* 새 글 작성 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex justify-center mb-16"
          >
            <Button 
              onClick={handleWritePost}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl"
              size="lg"
            >
              <PlusIcon className="w-6 h-6 mr-3" />
              새 글 작성
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 게시판 콘텐츠 */}
      <div className="relative z-10 container mx-auto px-6 pb-16 max-w-6xl">
      
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <BoardList
              onWritePost={handleWritePost}
              onSelectPost={handleSelectPost}
            />
          </motion.div>
        )}

        {view === 'write' && (
          <motion.div
            key="write"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <PostForm
              isOpen={true}
              onClose={handleBackToList}
              onSuccess={handlePostSuccess}
              initialData={editingPost ? {
                title: editingPost.title,
                content: editingPost.content,
                category: editingPost.category,
                isAnonymous: editingPost.isAnonymous
              } : undefined}
            />
          </motion.div>
        )}

        {view === 'detail' && selectedPost && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <PostDetail
              post={selectedPost}
              onBack={handleBackToList}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

export default function BoardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로딩 중...</h2>
          <p className="text-gray-600">게시판을 불러오고 있습니다.</p>
        </div>
      </div>
    }>
      <BoardContent />
    </Suspense>
  )
}
