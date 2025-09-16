import { supabase } from './supabase'
import { Post, Comment, Event, User, SignupForm } from '@/types'

// 교회 도메인 서비스 제거됨 (단순화)

// 사용자 관련 서비스
export const userService = {
  // 사용자 프로필 생성
  async createProfile(userId: string, data: Omit<SignupForm, 'password' | 'confirmPassword'>): Promise<User | null> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: data.email,
          name: data.name,
          phone: data.phone,
          church_domain_id: '00000000-0000-0000-0000-000000000000' // 기본값
        })
        .select()
        .single()

      if (error) throw error
      return profile
    } catch (error) {
      console.error('사용자 프로필 생성 오류:', error)
      return null
    }
  },

  // 사용자 프로필 조회
  async getProfile(userId: string): Promise<User | null> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          church_domains (
            id,
            domain,
            name
          )
        `)
        .eq('id', userId)
        .single()

      if (error) throw error
      return profile
    } catch (error) {
      console.error('사용자 프로필 조회 오류:', error)
      return null
    }
  },

  // 사용자 승인
  async approveUser(userId: string, approvedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: approvedBy
        })
        .eq('id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('사용자 승인 오류:', error)
      return false
    }
  }
}

// 게시글 관련 서비스
export const postService = {
  // 게시글 목록 조회
  async getPosts(filters: {
    category?: string | undefined
    search?: string | undefined
    sortBy?: string | undefined
    page?: number
    limit?: number
  }): Promise<{ posts: Post[]; total: number }> {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user_profiles (
            id,
            name,
            email
          )
        `, { count: 'exact' })

      // 카테고리 필터
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      // 검색 필터
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
      }

      // 정렬
      switch (filters.sortBy) {
        case 'popular':
          query = query.order('like_count', { ascending: false })
          break
        case 'views':
          query = query.order('view_count', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      // 페이지네이션
      const page = filters.page || 1
      const limit = filters.limit || 10
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data: posts, error, count } = await query

      if (error) throw error

      return {
        posts: posts || [],
        total: count || 0
      }
    } catch (error) {
      console.error('게시글 목록 조회 오류:', error)
      return { posts: [], total: 0 }
    }
  },

  // 게시글 상세 조회
  async getPost(postId: string): Promise<Post | null> {
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          *,
          user_profiles (
            id,
            name,
            email
          )
        `)
        .eq('id', postId)
        .single()

      if (error) throw error

      // 조회수 증가
      await this.incrementViewCount(postId)

      return post
    } catch (error) {
      console.error('게시글 상세 조회 오류:', error)
      return null
    }
  },

  // 게시글 생성
  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'likeCount'>): Promise<Post | null> {
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          title: data.title,
          content: data.content,
          author_id: data.authorId,
          category: data.category,
          is_anonymous: data.isAnonymous,
          attachments: data.attachments || []
        })
        .select()
        .single()

      if (error) throw error
      return post
    } catch (error) {
      console.error('게시글 생성 오류:', error)
      return null
    }
  },

  // 게시글 수정
  async updatePost(postId: string, data: Partial<Post>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: data.title,
          content: data.content,
          category: data.category,
          is_anonymous: data.isAnonymous
        })
        .eq('id', postId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('게시글 수정 오류:', error)
      return false
    }
  },

  // 게시글 삭제
  async deletePost(postId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('게시글 삭제 오류:', error)
      return false
    }
  },

  // 조회수 증가
  async incrementViewCount(postId: string): Promise<void> {
    try {
      await supabase.rpc('increment_post_view_count', { post_id: postId })
    } catch (error) {
      console.error('조회수 증가 오류:', error)
    }
  }
}

// 알림 관련 서비스
export const notificationService = {
  // 알림 목록 조회
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return notifications || []
    } catch (error) {
      console.error('알림 목록 조회 오류:', error)
      return []
    }
  },

  // 알림 생성
  async createNotification(data: { userId: string; title: string; message: string; type: string; relatedId?: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          related_id: data.relatedId
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('알림 생성 오류:', error)
      return false
    }
  },

  // 알림 읽음 처리
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error)
      return false
    }
  },

  // 모든 알림 읽음 처리
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return true
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error)
      return false
    }
  },

  // 알림 삭제
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('알림 삭제 오류:', error)
      return false
    }
  }
}

// 댓글 관련 서비스
export const commentService = {
  // 댓글 목록 조회
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          *,
          user_profiles (
            id,
            name,
            email
          )
        `)
        .eq('post_id', postId)
        .is('deleted_at', null) // 삭제되지 않은 댓글만 조회
        .order('created_at', { ascending: true })

      if (error) throw error
      return comments || []
    } catch (error) {
      console.error('댓글 목록 조회 오류:', error)
      return []
    }
  },

  // 댓글 생성
  async createComment(data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment | null> {
    try {
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          post_id: data.postId,
          content: data.content,
          author_id: data.authorId,
          is_anonymous: data.isAnonymous,
          parent_id: data.parentId || null
        })
        .select()
        .single()

      if (error) throw error
      return comment
    } catch (error) {
      console.error('댓글 생성 오류:', error)
      return null
    }
  },

  // 댓글 수정
  async updateComment(commentId: string, content: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', commentId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('댓글 수정 오류:', error)
      return false
    }
  },

  // 댓글 삭제 (소프트 삭제)
  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('댓글 삭제 오류:', error)
      return false
    }
  }
}

// 이벤트 관련 서비스
export const eventService = {
  // 이벤트 목록 조회
  async getEvents(filters: {
    startDate?: Date
    endDate?: Date
    category?: string
  }): Promise<Event[]> {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          user_profiles (
            id,
            name,
            email
          )
        `)

      // 날짜 필터
      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate.toISOString())
      }
      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate.toISOString())
      }

      // 카테고리 필터
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      query = query.order('start_date', { ascending: true })

      const { data: events, error } = await query

      if (error) throw error
      return events || []
    } catch (error) {
      console.error('이벤트 목록 조회 오류:', error)
      return []
    }
  },

  // 이벤트 생성
  async createEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event | null> {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .insert({
          title: data.title,
          description: data.description,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
          all_day: data.isAllDay,
          location: data.location,
          category: data.category,
          created_by: data.authorId
        })
        .select()
        .single()

      if (error) throw error
      return event
    } catch (error) {
      console.error('이벤트 생성 오류:', error)
      return null
    }
  },

  // 이벤트 수정
  async updateEvent(eventId: string, data: Partial<Event>): Promise<boolean> {
    try {
      const updateData: any = {}
      if (data.title) updateData.title = data.title
      if (data.description) updateData.description = data.description
      if (data.startDate) updateData.start_date = data.startDate.toISOString()
      if (data.endDate) updateData.end_date = data.endDate.toISOString()
      if (data.isAllDay !== undefined) updateData.all_day = data.isAllDay
      if (data.location) updateData.location = data.location
      if (data.category) updateData.category = data.category

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('이벤트 수정 오류:', error)
      return false
    }
  },

  // 이벤트 삭제
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('이벤트 삭제 오류:', error)
      return false
    }
  },

  // 이벤트 참가자 조회
  async getEventParticipants(eventId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      // 현재는 모든 사용자를 반환 (향후 이벤트 참가자 테이블 구현 시 수정)
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .eq('is_approved', true)

      if (error) throw error
      return { data: users, error: null }
    } catch (error) {
      console.error('이벤트 참가자 조회 오류:', error)
      return { data: null, error }
    }
  }
}

// 좋아요 관련 서비스
export const likeService = {
  // 좋아요 추가/제거
  async toggleLike(userId: string, postId?: string, commentId?: string): Promise<boolean> {
    try {
      if (!postId && !commentId) return false

      // 기존 좋아요 확인
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq(postId ? 'post_id' : 'comment_id', postId || commentId)
        .single()

      if (existingLike) {
        // 좋아요 제거
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id)

        if (error) throw error
        return false
      } else {
        // 좋아요 추가
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: userId,
            post_id: postId,
            comment_id: commentId
          })

        if (error) throw error
        return true
      }
    } catch (error) {
      console.error('좋아요 토글 오류:', error)
      return false
    }
  },

  // 좋아요 상태 확인
  async isLiked(userId: string, postId?: string, commentId?: string): Promise<boolean> {
    try {
      if (!postId && !commentId) return false

      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq(postId ? 'post_id' : 'comment_id', postId || commentId)
        .single()

      return !!like
    } catch (error) {
      return false
    }
  }
}
