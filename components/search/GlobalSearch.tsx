'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MagnifyingGlassIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  UserIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { SearchFilters, SearchResult, Post, Event, User } from '@/types'
import { searchService } from '@/lib/search'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  onSelectPost?: (post: Post) => void
  onSelectEvent?: (event: Event) => void
  onSelectUser?: (user: User) => void
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onSelectPost,
  onSelectEvent,
  onSelectUser
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    type: 'all'
  })
  const [popularSearches, setPopularSearches] = useState<string[]>([])

  // 인기 검색어 로드
  useEffect(() => {
    if (isOpen) {
      loadPopularSearches()
    }
  }, [isOpen])

  const loadPopularSearches = async () => {
    try {
      const searches = await searchService.getPopularSearches()
      setPopularSearches(searches)
    } catch (error) {
      console.error('인기 검색어 로드 오류:', error)
    }
  }

  // 검색 실행
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    try {
      setIsLoading(true)
      const searchResults = await searchService.searchAll(searchQuery, filters)
      setResults(searchResults)
      
      // 검색 기록 저장 (사용자 ID가 있는 경우)
      // await searchService.saveSearchHistory(searchQuery, userId)
    } catch (error) {
      console.error('검색 오류:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // 검색어 입력 시 디바운스 적용
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, handleSearch])

  // 검색어 클릭
  const handleSearchClick = (searchTerm: string) => {
    setQuery(searchTerm)
    handleSearch(searchTerm)
  }

  // 결과 항목 클릭
  const handleResultClick = (type: 'post' | 'event' | 'user', item: SearchResult) => {
    if (type === 'post' && onSelectPost) {
      // SearchResult를 Post로 변환
      const post: Post = {
        id: item.id,
        title: item.title,
        content: item.content || '',
        category: 'free', // 기본값
        authorId: 'anonymous',
        isAnonymous: true,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        createdAt: item.createdAt,
        updatedAt: item.createdAt
      }
      onSelectPost(post)
    } else if (type === 'event' && onSelectEvent) {
      // SearchResult를 Event로 변환
      const event: Event = {
        id: item.id,
        title: item.title,
        ...(item.content && { description: item.content }),
        startDate: item.createdAt,
        endDate: item.createdAt,
        category: 'event', // 기본값
        isAllDay: false,
        authorId: 'anonymous',
        currentAttendees: 0,
        attendees: [],
        createdAt: item.createdAt,
        updatedAt: item.createdAt
      }
      onSelectEvent(event)
    } else if (type === 'user' && onSelectUser) {
      // SearchResult를 User로 변환
            const user: User = {
              id: item.id,
              email: item.content || '',
              name: item.title,
              role: 'member',
              isApproved: true,
              createdAt: item.createdAt,
              updatedAt: item.createdAt
            }
      onSelectUser(user)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl"
      >
        {/* 검색 헤더 */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="게시글, 일정, 사용자를 검색해보세요..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
                autoFocus
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="max-h-96 overflow-y-auto">
          {!query.trim() ? (
            /* 인기 검색어 */
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">인기 검색어</h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search) => (
                  <Button
                    key={search}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearchClick(search)}
                    className="text-sm"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          ) : isLoading ? (
            /* 로딩 상태 */
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">검색 중...</p>
            </div>
          ) : results.length > 0 ? (
            /* 검색 결과 */
            <div className="p-6 space-y-6">
              {/* 게시글 결과 */}
              {results.filter(r => r.type === 'post').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                    게시글 ({results.filter(r => r.type === 'post').length})
                  </h3>
                  <div className="space-y-2">
                    {results.filter(r => r.type === 'post').map((post) => (
                      <Card
                        key={post.id}
                        hover
                        className="cursor-pointer"
                        onClick={() => handleResultClick('post', post)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral-900 line-clamp-1">
                                {post.title}
                              </h4>
                              <p className="text-sm text-neutral-600 line-clamp-1">
                                {post.content}
                              </p>
                            </div>
                            <div className="text-xs text-neutral-500 text-right">
                              <div>{post.author || '익명'}</div>
                              <div>{new Date(post.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* 일정 결과 */}
              {results.filter(r => r.type === 'event').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-green-500" />
                    일정 ({results.filter(r => r.type === 'event').length})
                  </h3>
                  <div className="space-y-2">
                    {results.filter(r => r.type === 'event').map((event) => (
                      <Card
                        key={event.id}
                        hover
                        className="cursor-pointer"
                        onClick={() => handleResultClick('event', event)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral-900 line-clamp-1">
                                {event.title}
                              </h4>
                              <p className="text-sm text-neutral-600 line-clamp-1">
                                {event.content || '설명 없음'}
                              </p>
                            </div>
                            <div className="text-xs text-neutral-500 text-right">
                              <div>{event.author || '알 수 없음'}</div>
                              <div>{new Date(event.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* 사용자 결과 */}
              {results.filter(r => r.type === 'user').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-purple-500" />
                    사용자 ({results.filter(r => r.type === 'user').length})
                  </h3>
                  <div className="space-y-2">
                    {results.filter(r => r.type === 'user').map((user) => (
                      <Card
                        key={user.id}
                        hover
                        className="cursor-pointer"
                        onClick={() => handleResultClick('user', user)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral-900">
                                {user.title}
                              </h4>
                              <p className="text-sm text-neutral-600">
                                {user.content}
                              </p>
                            </div>
                            <div className="text-xs text-neutral-500">
                              {user.author}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* 결과가 없는 경우 */}
              {results.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-neutral-600 mb-2">검색 결과가 없습니다.</p>
                  <p className="text-sm text-neutral-500">
                    다른 검색어를 시도해보세요.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
