'use client'

import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Comment } from '@/types'

interface UseRealtimeCommentsProps {
  postId: string
  onCommentAdded?: (comment: Comment) => void
  onCommentUpdated?: (comment: Comment) => void
  onCommentDeleted?: (commentId: string) => void
}

export function useRealtimeComments({
  postId,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted
}: UseRealtimeCommentsProps) {
  
  // 실시간 댓글 구독 설정
  const setupRealtimeSubscription = useCallback(() => {
    // 댓글 테이블 변경 감지
    const commentsSubscription = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          if (onCommentAdded && payload.new) {
            onCommentAdded(payload.new as Comment)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          if (onCommentUpdated && payload.new) {
            onCommentUpdated(payload.new as Comment)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          if (onCommentDeleted && payload.old) {
            onCommentDeleted(payload.old.id)
          }
        }
      )
      .subscribe()

    return commentsSubscription
  }, [postId, onCommentAdded, onCommentUpdated, onCommentDeleted])

  // 실시간 구독 시작
  useEffect(() => {
    const subscription = setupRealtimeSubscription()

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [setupRealtimeSubscription])

  // 수동으로 구독 해제하는 함수
  const unsubscribe = useCallback(() => {
    supabase.removeAllChannels()
  }, [])

  return {
    unsubscribe
  }
}
