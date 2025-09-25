'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UsersIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import Link from 'next/link'

interface PendingUser {
  id: string
  email: string
  name: string
  phone?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  church_domain_id?: string
  church_domains?: {
    id: string
    name: string
    domain: string
  }
  rejection_reason?: string
  approved_at?: string
  rejected_at?: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function ApprovalsPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    status: 'pending'
  })
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // 대기 중 사용자 목록 로딩
  const loadPendingUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const searchParams = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '10',
        status: filters.status,
        search: filters.search
      })
      
      const response = await fetch(`/api/admin/users/pending?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('사용자 목록을 불러오는데 실패했습니다.')
      }
      
      const result = await response.json()
      setPendingUsers(result.data.users)
      setPagination(result.data.pagination)
      
    } catch (error) {
      console.error('사용자 목록 로딩 오류:', error)
      // 임시 데이터로 대체
      setPendingUsers([
        {
          id: '1',
          email: 'user1@example.com',
          name: '김철수',
          phone: '010-1234-5678',
          status: 'pending',
          created_at: new Date().toISOString(),
          church_domains: {
            id: '1',
            name: '예수교회',
            domain: 'jesuschurch.com'
          }
        },
        {
          id: '2',
          email: 'user2@example.com',
          name: '이영희',
          phone: '010-2345-6789',
          status: 'pending',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          church_domains: {
            id: '2',
            name: '사랑교회',
            domain: 'lovechurch.com'
          }
        }
      ])
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalCount: 2,
        hasNextPage: false,
        hasPrevPage: false
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, pagination.currentPage])
  
  useEffect(() => {
    loadPendingUsers()
  }, [loadPendingUsers])

  // 관리자 권한 확인
  if (!user || !permissions.canAccessAdminPanel()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-4">이 페이지에 접근하려면 관리자 권한이 필요합니다.</p>
          <Link href="/">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  // 사용자 승인
  const handleApprove = async (userId: string) => {
    try {
      setIsProcessing(true)
      
      const response = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ userId })
      })
      
      if (!response.ok) {
        throw new Error('사용자 승인에 실패했습니다.')
      }
      
      // 목록에서 제거
      setPendingUsers(prev => prev.filter(u => u.id !== userId))
      
    } catch (error) {
      console.error('사용자 승인 오류:', error)
      alert('사용자 승인에 실패했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }
  
  // 사용자 거절
  const handleReject = async () => {
    if (!selectedUser || !rejectReason.trim()) return
    
    try {
      setIsProcessing(true)
      
      const response = await fetch('/api/admin/users/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ 
          userId: selectedUser.id, 
          reason: rejectReason.trim() 
        })
      })
      
      if (!response.ok) {
        throw new Error('사용자 거절에 실패했습니다.')
      }
      
      // 목록에서 제거
      setPendingUsers(prev => prev.filter(u => u.id !== selectedUser.id))
      setShowRejectModal(false)
      setSelectedUser(null)
      setRejectReason('')
      
    } catch (error) {
      console.error('사용자 거절 오류:', error)
      alert('사용자 거절에 실패했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const openRejectModal = (user: PendingUser) => {
    setSelectedUser(user)
    setShowRejectModal(true)
  }
  
  const closeRejectModal = () => {
    setShowRejectModal(false)
    setSelectedUser(null)
    setRejectReason('')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  ← 대시보드
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">사용자 승인 관리</h1>
                <p className="text-sm text-gray-600">가입 요청 승인 및 거절</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        {/* 필터 */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">필터:</span>
            </div>
            
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <option value="pending">승인 대기</option>
              <option value="rejected">거절됨</option>
              <option value="approved">승인됨</option>
            </Select>
            
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="이름 또는 이메일 검색..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Button
              onClick={() => setFilters({ search: '', status: 'pending' })}
              variant="outline"
            >
              초기화
            </Button>
          </div>
        </Card>
        
        {/* 사용자 목록 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {filters.status === 'pending' ? '승인 대기' : 
               filters.status === 'rejected' ? '거절됨' : '승인됨'} 사용자
            </h2>
            <span className="text-sm text-gray-600">
              총 {pagination.totalCount}명
            </span>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">사용자 목록을 불러오는 중...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">표시할 사용자가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">사용자 정보</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">교회</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">요청일</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">액션</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {pendingUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                            {user.phone && (
                              <div className="text-sm text-gray-500">{user.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.church_domains?.name || '교회 정보 없음'}
                            </div>
                            {user.church_domains?.domain && (
                              <div className="text-sm text-gray-500">
                                {user.church_domains.domain}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="py-4 px-4">
                          {filters.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(user.id)}
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRejectModal(user)}
                                disabled={isProcessing}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <XCircleIcon className="w-4 h-4 mr-1" />
                                거절
                              </Button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
          
          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={!pagination.hasPrevPage}
              >
                이전
              </Button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={page === pagination.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={!pagination.hasNextPage}
              >
                다음
              </Button>
            </div>
          )}
        </Card>
      </div>
      
      {/* 거절 사유 모달 */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                사용자 거절
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{selectedUser?.name}</strong> 사용자를 거절하시겠습니까?
                </p>
                <p className="text-sm text-gray-500">
                  거절 사유를 입력해주세요.
                </p>
              </div>
              
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="거절 사유를 입력하세요..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={closeRejectModal}
                  disabled={isProcessing}
                >
                  취소
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || isProcessing}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isProcessing ? '처리 중...' : '거절'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
