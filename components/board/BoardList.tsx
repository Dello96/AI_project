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
    <div className="space-y-6">
      {/* 필터 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 카테고리 필터 */}
            <div className="flex gap-2">
              <Button
                variant={filters.category === undefined ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilter(undefined)}
              >
                전체
              </Button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Button
                  key={key}
                  variant={filters.category === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryFilter(key as any)}
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
                className="max-w-md"
              />
            </div>

            {/* 정렬 */}
            <div className="flex gap-2">
                          <Button
              variant={filters.sortBy === 'latest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('latest')}
            >
              최신순
            </Button>
            <Button
              variant={filters.sortBy === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('popular')}
            >
              인기순
            </Button>
            <Button
              variant={filters.sortBy === 'views' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('views')}
            >
              조회순
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 게시글 목록 */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">게시물이 아직 없습니다!</p>
                  <p className="text-gray-500 text-sm">
                    {filters.category ? `${categoryLabels[filters.category]}에` : '이 게시판에'} 첫 번째 글을 작성해보세요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                hover 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg"
              >
                <CardContent 
                  className="p-4"
                  onClick={() => onSelectPost(post)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[post.category]}`}>
                          {categoryLabels[post.category]}
                        </span>
                        {post.isAnonymous && (
                          <span className="px-2 py-1 bg-secondary-100 text-secondary-600 rounded-full text-xs">
                            익명
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-secondary-900 mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-secondary-500">
                        <span>{post.isAnonymous ? '익명' : post.author?.name || '알 수 없음'}</span>
                        <div className="flex items-center gap-4">
                          <LikeButton
                            postId={post.id}
                            initialLikeCount={post.likeCount || 0}
                            initialIsLiked={post.userLiked || false}
                            size="sm"
                          />
                          <div className="flex items-center gap-1">
                            <ChatBubbleLeftIcon className="w-4 h-4" />
                            <span>{post.commentCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>조회 {post.viewCount}</span>
                          </div>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* 로드 모어 트리거 및 로딩 인디케이터 */}
      {hasMore && posts.length > 0 && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">게시글을 불러오는 중...</span>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">스크롤하여 더 보기</div>
          )}
        </div>
      )}

      {/* 모든 게시글을 로드한 경우 */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">모든 게시글을 불러왔습니다.</p>
        </div>
      )}
    </div>
  )
}
