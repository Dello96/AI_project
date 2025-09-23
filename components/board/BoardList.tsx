'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'
import { Post, postCategories } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import LikeButton from '@/components/ui/LikeButton'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { postService } from '@/lib/database'

interface BoardListProps {
  onWritePost: () => void
  onSelectPost: (post: Post) => void
}

const categoryIcons = {
  notice: DocumentTextIcon,
  free: ChatBubbleLeftRightIcon,
  qa: QuestionMarkCircleIcon
}

const categoryLabels = {
  notice: '공지사항',
  free: '자유게시판',
  qna: 'Q&A'
}

const categoryColors = {
  notice: 'bg-red-100 text-red-600',
  free: 'bg-blue-100 text-blue-600',
  qna: 'bg-green-100 text-green-600'
}

export default function BoardList({ onWritePost, onSelectPost }: BoardListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [filters, setFilters] = useState({
    category: 'free' as 'notice' | 'free' | 'qna' | undefined,
    search: '',
    sortBy: 'latest' as 'latest' | 'popular' | 'views'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalPosts, setTotalPosts] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isLoadingRef = useRef(false)

  // 게시글 목록 조회
  const fetchPosts = async (page: number = 1, append: boolean = false) => {
    // 이미 로딩 중이면 중복 요청 방지
    if (isLoadingRef.current) return
    
    try {
      isLoadingRef.current = true
      if (page === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      
      // API 호출을 위한 쿼리 파라미터 구성
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.search) params.append('search', filters.search)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      params.append('page', page.toString())
      params.append('limit', '5') // 5개씩 로드
      
      const response = await fetch(`/api/board/posts?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        if (append) {
          setPosts(prev => [...prev, ...data.data.posts])
        } else {
          setPosts(data.data.posts)
        }
        setTotalPosts(data.data.pagination.totalCount)
        // 현재까지 로드된 게시글 수가 전체 게시글 수보다 적으면 더 로드 가능
        const currentTotalLoaded = append ? posts.length + data.data.posts.length : data.data.posts.length
        const shouldHaveMore = currentTotalLoaded < data.data.pagination.totalCount
        console.log('게시글 로드 상태:', {
          page,
          append,
          '받은 게시글 수': data.data.posts.length,
          '현재 총 로드된 수': currentTotalLoaded,
          '전체 게시글 수': data.data.pagination.totalCount,
          '더 로드 가능': shouldHaveMore
        })
        setHasMore(shouldHaveMore)
      } else {
        console.error('게시글 조회 실패:', data.error)
      }
    } catch (error) {
      console.error('게시글 조회 오류:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      isLoadingRef.current = false
    }
  }

  // Intersection Observer 설정
  useEffect(() => {
    if (!hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingRef.current) {
          console.log('Intersection detected, loading more...')
          setCurrentPage(prev => prev + 1)
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current)
      }
      observer.disconnect()
    }
  }, [hasMore, posts.length])

  // 필터 변경 시 게시글 재조회
  useEffect(() => {
    setCurrentPage(1)
    setPosts([])
    setHasMore(true)
    fetchPosts(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // 페이지 변경 시 게시글 추가 로드
  useEffect(() => {
    if (currentPage > 1 && hasMore && !isLoadingMore) {
      fetchPosts(currentPage, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, hasMore, isLoadingMore])

  const handleCategoryFilter = (category: 'notice' | 'free' | 'qna' | undefined) => {
    setFilters(prev => ({ ...prev, category }))
  }

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }

  const handleSort = (sortBy: 'latest' | 'popular' | 'views') => {
    setFilters(prev => ({ ...prev, sortBy }))
  }


  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* 필터 스켈레톤 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex gap-2">
                <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-9 w-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex-1">
                <div className="h-12 w-full max-w-md bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 게시글 목록 스켈레톤 */}
        <ListSkeleton items={5} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 필터 - 극장 스타일 */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-orange-500/20 shadow-2xl p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 카테고리 필터 */}
          <div className="flex gap-3">
            <Button
              variant={filters.category === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryFilter(undefined)}
              className={filters.category === undefined 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'
              }
            >
              전체
            </Button>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Button
                key={key}
                variant={filters.category === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilter(key as any)}
                className={filters.category === key 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'
                }
              >
                {label}
              </Button>
            ))}
          </div>

          {/* 검색 */}
          <div className="flex-1">
            <Input
              type="search"
              placeholder="제목으로 검색..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
            />
          </div>

          {/* 정렬 */}
          <div className="flex gap-3">
            <Button
              variant={filters.sortBy === 'latest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('latest')}
              className={filters.sortBy === 'latest' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'
              }
            >
              최신순
            </Button>
            <Button
              variant={filters.sortBy === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('popular')}
              className={filters.sortBy === 'popular' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'
              }
            >
              인기순
            </Button>
            <Button
              variant={filters.sortBy === 'views' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('views')}
              className={filters.sortBy === 'views' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'
              }
            >
              조회순
            </Button>
          </div>
        </div>
      </div>

      {/* 게시글 목록 - 극장 스타일 */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-orange-500/20 shadow-2xl p-12 text-center">
            <div className="flex flex-col items-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl">
                <DocumentTextIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-3">게시물이 아직 없습니다!</p>
                <p className="text-gray-400 text-lg">
                  {filters.category ? `${categoryLabels[filters.category]}에` : '이 게시판에'} 첫 번째 글을 작성해보세요.
                </p>
              </div>
            </div>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div 
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-orange-500/20 shadow-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-3xl hover:scale-[1.02] hover:border-orange-500/40"
                onClick={() => onSelectPost(post)}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        post.category === 'notice' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        post.category === 'free' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {categoryLabels[post.category]}
                      </span>
                      {post.isAnonymous && (
                        <span className="px-4 py-2 bg-gray-600/20 text-gray-300 rounded-full text-sm border border-gray-600/30">
                          익명
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-4 line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-300 text-lg mb-6 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-gray-400">
                        <span className="text-lg font-medium">
                          {post.isAnonymous ? '익명' : post.author?.name || '알 수 없음'}
                        </span>
                        <span className="text-sm">
                          {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <LikeButton
                          postId={post.id}
                          initialLikeCount={post.likeCount || 0}
                          initialIsLiked={post.userLiked || false}
                          size="md"
                          className="text-white hover:text-red-400"
                        />
                        <div className="flex items-center gap-2 text-gray-400">
                          <ChatBubbleLeftIcon className="w-5 h-5" />
                          <span className="text-lg font-medium">{post.commentCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="text-lg font-medium">조회 {post.viewCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 로드 모어 트리거 및 로딩 인디케이터 - 극장 스타일 */}
      {hasMore && posts.length > 0 && (
        <div ref={loadMoreRef} className="flex justify-center py-12">
          {isLoadingMore ? (
            <div className="flex items-center gap-4 bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-4 rounded-2xl border border-orange-500/20 shadow-2xl">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-lg font-medium">게시글을 불러오는 중...</span>
            </div>
          ) : (
            <div className="text-gray-400 text-lg font-medium bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-3 rounded-xl border border-orange-500/20">
              스크롤하여 더 보기
            </div>
          )}
        </div>
      )}

      {/* 모든 게시글을 로드한 경우 */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-12">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-4 rounded-2xl border border-orange-500/20 shadow-2xl inline-block">
            <p className="text-gray-400 text-lg font-medium">모든 게시글을 불러왔습니다.</p>
          </div>
        </div>
      )}
    </div>
  )
}
