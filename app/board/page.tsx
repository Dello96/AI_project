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
    if (postId) {
      // 게시글 ID가 있으면 해당 게시글을 조회하고 상세 페이지로 이동
      const fetchPost = async () => {
        try {
          const post = await postService.getPost(postId)
          if (post) {
            setSelectedPost(post)
            setView('detail')
          }
        } catch (error) {
          console.error('게시글 조회 오류:', error)
        }
      }
      fetchPost()
    }
  }, [searchParams])

  const handleBackToList = () => {
    setView('list')
    setSelectedPost(null)
    setEditingPost(null)
  }


  return (
    <div className="container mx-auto px-4 pt-8 pb-4 max-w-6xl">
      {/* 게시판 헤더 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">게시판</h1>
            <p className="text-gray-600 mt-2">청년부 소식과 이야기를 나누어보세요</p>
          </div>
          <div className="flex gap-2">
            <Button variant="default" size="lg" onClick={handleWritePost}>
              <PlusIcon className="w-5 h-5 mr-2" />
              새 글 작성
            </Button>
          </div>
        </div>
      </div>
      
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
