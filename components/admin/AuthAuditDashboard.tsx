'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  EyeIcon, 
  ExclamationTriangleIcon, 
  CheckIcon, 
  XMarkIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'

interface AuthAuditLog {
  id: string
  email: string
  action: 'login_success' | 'login_failure' | 'logout' | 'token_refresh'
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  details?: any
}

export default function AuthAuditDashboard({ className = '' }: { className?: string }) {
  const { user } = useAuth()
  const permissions = usePermissions()
  
  const [auditLogs, setAuditLogs] = useState<AuthAuditLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    action: 'all',
    email: '',
    dateRange: '7d'
  })
  
  // 감사 로그 로딩 (실제로는 API에서 가져옴)
  const loadAuditLogs = async () => {
    setIsLoading(true)
    try {
      // 임시 데이터 (실제로는 API 호출)
      const mockLogs: AuthAuditLog[] = [
        {
          id: '1',
          email: 'admin@church.kr',
          action: 'login_success',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          timestamp: new Date(),
          details: { userId: 'user-1', role: 'admin' }
        },
        {
          id: '2',
          email: 'user@church.kr',
          action: 'login_failure',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          details: { reason: 'invalid_password' }
        },
        {
          id: '3',
          email: 'leader@church.kr',
          action: 'logout',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          details: { reason: 'user_logout' }
        }
      ]
      
      setAuditLogs(mockLogs)
    } catch (error) {
      console.error('감사 로그 로딩 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    loadAuditLogs()
  }, [])
  
  // 필터링된 로그
  const filteredLogs = auditLogs.filter(log => {
    if (filters.action !== 'all' && log.action !== filters.action) return false
    if (filters.email && !log.email.includes(filters.email)) return false
    return true
  })
  
  // 액션별 아이콘 및 색상
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login_success':
        return <CheckIcon className="w-5 h-5 text-green-500" />
      case 'login_failure':
        return <XMarkIcon className="w-5 h-5 text-red-500" />
      case 'logout':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500" />
      case 'token_refresh':
        return <ArrowPathIcon className="w-5 h-5 text-purple-500" />
      default:
        return <EyeIcon className="w-5 h-5 text-gray-500" />
    }
  }
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'login_success':
        return 'bg-green-100 text-green-800'
      case 'login_failure':
        return 'bg-red-100 text-red-800'
      case 'logout':
        return 'bg-blue-100 text-blue-800'
      case 'token_refresh':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'login_success':
        return '로그인 성공'
      case 'login_failure':
        return '로그인 실패'
      case 'logout':
        return '로그아웃'
      case 'token_refresh':
        return '토큰 갱신'
      default:
        return action
    }
  }
  
  // 관리자 권한 확인
  if (!user || !permissions.canAccessAdminPanel()) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">접근 권한이 없습니다</h3>
        <p className="text-gray-600">이 페이지에 접근하려면 관리자 권한이 필요합니다.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">인증 감사 로그</h2>
          <p className="text-gray-600">사용자 인증 활동을 모니터링하고 보안 이벤트를 추적합니다.</p>
        </div>
        <Button onClick={loadAuditLogs} disabled={isLoading}>
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>
      
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">성공한 로그인</p>
              <p className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.action === 'login_success').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XMarkIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">실패한 로그인</p>
              <p className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.action === 'login_failure').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowPathIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">로그아웃</p>
              <p className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.action === 'logout').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowPathIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">토큰 갱신</p>
              <p className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.action === 'token_refresh').length}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* 필터 */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">필터:</span>
          </div>
          
          <Select
            value={filters.action}
            onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
          >
            <option value="all">모든 액션</option>
            <option value="login_success">로그인 성공</option>
            <option value="login_failure">로그인 실패</option>
            <option value="logout">로그아웃</option>
            <option value="token_refresh">토큰 갱신</option>
          </Select>
          
          <input
            type="text"
            placeholder="이메일 검색..."
            value={filters.email}
            onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          
          <Select
            value={filters.dateRange}
            onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
          >
            <option value="1d">최근 24시간</option>
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
            <option value="all">전체</option>
          </Select>
        </div>
      </Card>
      
      {/* 로그 테이블 */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">액션</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">사용자</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">IP 주소</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">시간</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">상세 정보</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{log.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{log.ipAddress || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {log.timestamp.toLocaleString('ko-KR')}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => console.log('상세 정보:', log.details)}
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      상세보기
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">표시할 로그가 없습니다.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
