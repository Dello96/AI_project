import { supabase } from './supabase'
import { Post, Event, User, SearchFilters, SearchResult } from '@/types'

export class SearchService {
  // 통합 검색
  async searchAll(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    try {
      const [posts, events, users] = await Promise.all([
        this.searchPosts(query, filters),
        this.searchEvents(query, filters),
        this.searchUsers(query, filters)
      ])

      const results: SearchResult[] = []

      // 게시글 결과 추가
      posts.forEach(post => {
        results.push({
          id: post.id,
          type: 'post',
          title: post.title,
          content: post.content,
          author: post.author?.name || '익명',
          createdAt: new Date(post.createdAt),
          url: `/board/${post.id}`
        })
      })

      // 일정 결과 추가
      events.forEach(event => {
        results.push({
          id: event.id,
          type: 'event',
          title: event.title,
          ...(event.description && { content: event.description }),
          author: event.author?.name || '익명',
          createdAt: new Date(event.createdAt),
          url: `/calendar/${event.id}`
        })
      })

      // 사용자 결과 추가
      users.forEach(user => {
        results.push({
          id: user.id,
          type: 'user',
          title: user.name,
          content: user.email,
          author: user.name,
          createdAt: new Date(user.createdAt),
          url: `/profile/${user.id}`
        })
      })

      return results
    } catch (error) {
      console.error('통합 검색 오류:', error)
      throw error
    }
  }

  // 게시글 검색
  async searchPosts(query: string, filters?: SearchFilters): Promise<Post[]> {
    try {
      let queryBuilder = supabase
        .from('posts')
        .select(`
          *,
          author:user_profiles(name, email)
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)

      if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category)
      }

      if (filters?.dateRange) {
        queryBuilder = queryBuilder
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString())
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('게시글 검색 오류:', error)
      return []
    }
  }

  // 일정 검색
  async searchEvents(query: string, filters?: SearchFilters): Promise<Event[]> {
    try {
      let queryBuilder = supabase
        .from('events')
        .select(`
          *,
          author:user_profiles(name, email)
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)

      if (filters?.dateRange) {
        queryBuilder = queryBuilder
          .gte('start_date', filters.dateRange.start.toISOString())
          .lte('end_date', filters.dateRange.end.toISOString())
      }

      const { data, error } = await queryBuilder
        .order('start_date', { ascending: true })
        .limit(20)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('일정 검색 오류:', error)
      return []
    }
  }

  // 사용자 검색
  async searchUsers(query: string, filters?: SearchFilters): Promise<User[]> {
    try {
      let queryBuilder = supabase
        .from('user_profiles')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)

      if (filters?.author) {
        queryBuilder = queryBuilder.eq('name', filters.author)
      }

      const { data, error } = await queryBuilder
        .order('name', { ascending: true })
        .limit(20)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('사용자 검색 오류:', error)
      return []
    }
  }

  // 인기 검색어 조회
  async getPopularSearches(): Promise<string[]> {
    try {
      // 실제 구현에서는 검색 로그를 저장하고 분석해야 합니다
      // 현재는 하드코딩된 인기 검색어를 반환합니다
      return [
        '예배',
        '소그룹',
        '청년부',
        '기도',
        '성경공부'
      ]
    } catch (error) {
      console.error('인기 검색어 조회 오류:', error)
      return []
    }
  }

  // 검색 기록 저장 (선택사항)
  async saveSearchHistory(query: string, userId: string): Promise<void> {
    try {
      // 실제 구현에서는 검색 기록을 저장하는 테이블이 필요합니다
    } catch (error) {
      console.error('검색 기록 저장 오류:', error)
    }
  }
}

export const searchService = new SearchService()
