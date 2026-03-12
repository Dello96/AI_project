'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import ReportButton from '@/components/reports/ReportButton'
import { Post, Comment, postCategories } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import LikeButton from '@/components/ui/LikeButton'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionsStore } from '@/stores/permissionsStore'
import { postService, commentService } from '@/lib/database'
import { useRealtimeComments } from '@/hooks/useRealtimeComments'
import { supabase } from '@/lib/supabase'

interface PostDetailProps {
  post: Post
  onBack: () => void
  onEdit: (post: Post) => void
  onDelete: (postId: string) => void
}

export default function PostDetail({ post, onBack, onEdit, onDelete }: PostDetailProps) {
  
  const { user } = useAuthStore()
  const permissions = usePermissionsStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [viewCount, setViewCount] = useState(post.viewCount || 0)
  
  // 초기 viewCount 설정 (서버에서 받은 값 그대로 사용)
  useEffect(() => {
    setViewCount(post.viewCount || 0)
  }, [post.viewCount])
  
  // 전역 중복 방지를 위한 고유 키 생성 (컴포넌트 마운트 시점에 고정)
  const [viewIncrementKey] = useState(() => `view_${post.id}_${Date.now()}_${Math.random()}`)
  const [hasIncremented, setHasIncremented] = useState(false)
  
  // React Strict Mode 중복 실행 완전 차단을 위한 ref
  const hasIncrementedRef = useRef(false)
  const hasInitializedRef = useRef(false)

  // post.id 변경 시 상태 및 ref 리셋 (viewCount는 별도 처리)
  useEffect(() => {
    setHasIncremented(false)
    hasIncrementedRef.current = false
    hasInitializedRef.current = false
    // viewCount는 별도의 useEffect에서 처리
  }, [post.id])

  // 실시간 댓글 구독
  useRealtimeComments({
    postId: post.id,
    onCommentAdded: (comment) => {
      setComments(prev => [comment, ...prev])
    },
    onCommentUpdated: (updatedComment) => {
      setComments(prev => prev.map(c => c.id === updatedComment.id ? updatedComment : c))
    },
    onCommentDeleted: (commentId) => {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
  })

  // 조회수 증가 (useRef 기반 중복 방지)
  const incrementViewCount = useCallback(async () => {
    
    // useRef 기반 중복 방지 체크 (React Strict Mode 완전 차단)
    if (hasIncrementedRef.current) {
      return
    }
    
    // 즉시 ref 설정하여 중복 호출 방지
    hasIncrementedRef.current = true
    setHasIncremented(true)
    
    try {
      const response = await fetch(`/api/board/posts/${post.id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        // 서버에서 받은 정확한 조회수로 UI 업데이트
        const newViewCount = result.viewCount || (viewCount + 1)
        setViewCount(newViewCount)
      } else {
        console.error('🎯 조회수 증가 실패:', result.error)
        // 실패 시 ref와 상태 리셋
        hasIncrementedRef.current = false
        setHasIncremented(false)
      }
    } catch (error) {
      console.error('🎯 조회수 증가 오류:', error)
      // 오류 시 ref와 상태 리셋
      hasIncrementedRef.current = false
      setHasIncremented(false)
    }
  }, [post.id, viewIncrementKey])

  // 댓글 목록 조회
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/board/posts/${post.id}/comments`)
      const result = await response.json()
      
      if (response.ok && result.success) {
        setComments(result.data)
      } else {
        console.error('댓글 조회 오류:', result.error)
      }
    } catch (error) {
      console.error('댓글 조회 오류:', error)
    }
  }, [post.id])

  // 댓글 작성
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!newComment.trim()) {
      setError('댓글 내용을 입력해주세요.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Supabase 세션에서 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.')
        return
      }

      const response = await fetch(`/api/board/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: newComment.trim(),
          isAnonymous
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setNewComment('')
        setIsAnonymous(false)
        await fetchComments()
      } else {
        console.error('댓글 작성 API 오류:', result)
        setError(result.error || result.details || '댓글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error)
      setError('댓글 작성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 댓글 수정 시작
  const handleCommentEdit = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  // 댓글 수정 취소
  const handleCommentEditCancel = () => {
    setEditingComment(null)
    setEditContent('')
  }

  // 댓글 수정 저장
  const handleCommentEditSave = async (commentId: string) => {
    if (!editContent.trim()) {
      setError('댓글 내용을 입력해주세요.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Supabase 세션에서 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.')
        return
      }

      const response = await fetch(`/api/board/posts/${post.id}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: editContent.trim() })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setEditingComment(null)
        setEditContent('')
        await fetchComments()
      } else {
        console.error('댓글 수정 API 오류:', result)
        setError(result.error || '댓글 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('댓글 수정 오류:', error)
      setError('댓글 수정 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 댓글 삭제
  const handleCommentDelete = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      // Supabase 세션에서 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.')
        return
      }

      const response = await fetch(`/api/board/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      })

      const result = await response.json()

      if (response.ok && result.success) {
        await fetchComments()
      } else {
        console.error('댓글 삭제 API 오류:', result)
        setError(result.error || '댓글 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('댓글 삭제 오류:', error)
      setError('댓글 삭제 중 오류가 발생했습니다.')
    }
  }

  // 게시글 삭제
  const handlePostDelete = () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return
    onDelete(post.id)
  }

  // 컴포넌트 마운트 시 한 번만 실행되도록 보장 (useRef 기반)
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      fetchComments()
      incrementViewCount() // 조회수 증가
    }
  }, [post.id, fetchComments, incrementViewCount])

  const categoryInfo = postCategories.find(cat => cat.value === post.category)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          목록으로
        </Button>
        
        <div className="flex gap-2">
          {/* 신고 버튼 */}
          <ReportButton
            targetType="post"
            targetId={post.id}
            targetTitle={post.title}
            variant="outline"
            size="sm"
          />
          
          {/* 수정/삭제 버튼 (작성자 또는 관리자만) */}
          {user && (user.id === post.authorId || user.role === 'admin') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(post)}
                className="flex items-center gap-2"
              >
                <PencilIcon className="w-4 h-4" />
                수정
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePostDelete}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <TrashIcon className="w-4 h-4" />
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 게시글 내용 */}
      <Card>
        <CardContent className="p-6">
          {/* 카테고리 및 메타 정보 */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryInfo?.color} text-white`}>
              {categoryInfo?.label}
            </span>
            {post.isAnonymous && (
              <span className="px-3 py-1 bg-secondary-100 text-secondary-600 rounded-full text-sm">
                익명
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">
            {post.title}
          </h1>

          {/* 작성자 정보 */}
          <div className="flex items-center justify-between text-sm text-secondary-500 mb-6">
            <span>
              {post.isAnonymous ? '익명' : post.author?.name || '알 수 없음'}
            </span>
            <div className="flex items-center gap-4">
              <LikeButton
                postId={post.id}
                initialLikeCount={post.likeCount || 0}
                initialIsLiked={post.userLiked || false}
                size="sm"
              />
              <span className="flex items-center gap-1">
                <EyeIcon className="w-4 h-4" />
                {viewCount}
              </span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* 내용 */}
          <div className="prose max-w-none">
            <p className="text-secondary-700 whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* 첨부파일 */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-secondary-700 mb-3">첨부파일 ({post.attachments.length}개)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {post.attachments.map((attachment, index) => {
                  const isImage = attachment.includes('image') || 
                    attachment.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                  
                  return (
                    <div key={index} className="group relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      {/* 썸네일 영역 */}
                      <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                        {isImage ? (
                          <img
                            src={attachment}
                            alt={`첨부파일 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <DocumentIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* 파일 정보 */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900 truncate" title={`첨부파일 ${index + 1}`}>
                          첨부파일 {index + 1}
                        </p>
                        <a
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center"
                        >
                          <DocumentIcon className="w-3 h-3 mr-1" />
                          다운로드
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 댓글 작성 */}
      {user && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">댓글 작성</h3>
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="commentAnonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="commentAnonymous" className="text-sm text-secondary-700">
                  익명으로 작성
                </label>
              </div>
              
              <textarea
                placeholder="댓글을 입력하세요"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 border-neutral-200 focus:border-primary-500 focus:ring-primary-100"
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="default"
                  loading={isLoading}
                  disabled={isLoading || !newComment.trim()}
                >
                  댓글 작성
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-secondary-900">
          댓글 ({comments.length})
        </h3>
        
        {comments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-secondary-500">댓글이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {comment.isAnonymous && (
                          <span className="px-2 py-1 bg-secondary-100 text-secondary-600 rounded-full text-xs">
                            익명
                          </span>
                        )}
                        <span className="text-sm text-secondary-500">
                          {comment.isAnonymous ? '익명' : comment.author?.name || '알 수 없음'}
                        </span>
                        <span className="text-xs text-secondary-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {editingComment === comment.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 border-neutral-200 focus:border-primary-500 focus:ring-primary-100"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleCommentEditSave(comment.id)}
                              loading={isLoading}
                              disabled={!editContent.trim()}
                            >
                              저장
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCommentEditCancel}
                              disabled={isLoading}
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-secondary-700 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {/* 좋아요 버튼 */}
                      <LikeButton
                        postId={comment.id}
                        initialLikeCount={comment.likeCount || 0}
                        initialIsLiked={false}
                        targetType="comment"
                        size="sm"
                      />
                      
                      {/* 신고 버튼 */}
                      <ReportButton
                        targetType="comment"
                        targetId={comment.id}
                        targetTitle={comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : '')}
                        variant="outline"
                        size="sm"
                      />
                      
                      {/* 수정/삭제 버튼 (작성자 또는 관리자만) */}
                      {user && (user.id === comment.authorId || user.role === 'admin') && editingComment !== comment.id && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCommentEdit(comment)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            수정
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCommentDelete(comment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            삭제
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
