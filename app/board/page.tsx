'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BoardList from '@/components/board/BoardList'
import PostForm from '@/components/board/PostForm'
import PostDetail from '@/components/board/PostDetail'
import { Post } from '@/types'
import { postService } from '@/lib/database'

export default function BoardPage() {
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

  const handleBackToList = () => {
    setView('list')
    setSelectedPost(null)
    setEditingPost(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
