'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AdminOnly } from '@/components/auth/PermissionGuard'
import { User, UserRole } from '@/types'

interface AdminUser extends User {
  isApproved: boolean
}

interface UserStats {
  total: number
  approved: number
  pending: number
  admins: number
  leaders: number
  members: number
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    approved: 0,
    pending: 0,
    admins: 0,
    leaders: 0,
    members: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })

      if (filters.search.trim()) {
        searchParams.set('search', filters.search.trim())
      }
      if (filters.role !== 'all') {
        searchParams.set('role', filters.role)
      }
      if (filters.status !== 'all') {
        searchParams.set('status', filters.status)
      }

      const response = await fetch(`/api/admin/users?${searchParams}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '사용자 목록 조회에 실패했습니다.')
      }

      setUsers(result.data.users)
      setTotalPages(result.data.pagination.totalPages)

      // 통계 계산
      const allUsers = result.data.users
      const newStats: UserStats = {
        total: allUsers.length,
        approved: allUsers.filter((u: AdminUser) => u.isApproved).length,
        pending: allUsers.filter((u: AdminUser) => !u.isApproved).length,
        admins: allUsers.filter((u: AdminUser) => u.role === 'admin').length,
        leaders: allUsers.filter((u: AdminUser) => u.role === 'leader').length,
        members: allUsers.filter((u: AdminUser) => u.role === 'member').length
      }
      setStats(newStats)

    } catch (error) {
      console.error('사용자 목록 조회 오류:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 사용자 역할/상태 업데이트
  const updateUser = async (userId: string, updates: { role?: UserRole; isApproved?: boolean }) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '사용자 정보 업데이트에 실패했습니다.')
      }

      // 목록 새로고침
      await fetchUsers()
    } catch (error) {
      console.error('사용자 업데이트 오류:', error)
      alert(error instanceof Error ? error.message : '업데이트에 실패했습니다.')
    }
  }

  // 필터 변경 시 재조회
  useEffect(() => {
    setCurrentPage(1)
    fetchUsers()
  }, [filters])

  // 페이지 변경 시 재조회
  useEffect(() => {
    fetchUsers()
  }, [currentPage])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <AdminOnly fallback={
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">관리자 권한이 필요합니다.</p>
          </CardContent>
        </Card>
      </div>
    }>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
          <p className="text-gray-600">사용자 관리 및 권한 설정</p>
        </motion.div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">전체 사용자</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <UserGroupIcon className="w-8 h-8 text-blue-500 mr-3" />
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">승인된 사용자</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircleIcon className="w-8 h-8 text-green-500 mr-3" />
                  <span className="text-2xl font-bold">{stats.approved}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">승인 대기</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ClockIcon className="w-8 h-8 text-yellow-500 mr-3" />
                  <span className="text-2xl font-bold">{stats.pending}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">관리자</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>관리자: {stats.admins}명</div>
                  <div>리더: {stats.leaders}명</div>
                  <div>멤버: {stats.members}명</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* 필터 및 검색 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5" />
                필터 및 검색
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="이름 또는 이메일 검색..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">모든 역할</option>
                  <option value="admin">관리자</option>
                  <option value="leader">리더</option>
                  <option value="member">멤버</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">모든 상태</option>
                  <option value="approved">승인됨</option>
                  <option value="pending">승인 대기</option>
                </select>

                <Button
                  onClick={() => setFilters({ search: '', role: 'all', status: 'all' })}
                  variant="outline"
                >
                  필터 초기화
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 사용자 목록 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>사용자 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">로딩 중...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  {error}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  사용자가 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">사용자</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">역할</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">상태</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">가입일</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={user.role}
                              onChange={(e) => updateUser(user.id, { role: e.target.value as UserRole })}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="member">멤버</option>
                              <option value="leader">리더</option>
                              <option value="admin">관리자</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isApproved
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.isApproved ? '승인됨' : '승인 대기'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              {!user.isApproved && (
                                <Button
                                  size="sm"
                                  onClick={() => updateUser(user.id, { isApproved: true })}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  승인
                                </Button>
                              )}
                              {user.isApproved && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateUser(user.id, { isApproved: false })}
                                >
                                  승인 취소
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    이전
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminOnly>
  )
}
