'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  UsersIcon, 
  ExclamationTriangleIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  pendingApprovals: number
  activeReports: number
  totalReports: number
  recentActivity: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingApprovals: 0,
    activeReports: 0,
    totalReports: 0,
    recentActivity: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  
  // 대시보드 통계 로딩
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        // 실제로는 API에서 데이터를 가져옴
        // 임시 데이터로 대체
        setStats({
          totalUsers: 156,
          pendingApprovals: 8,
          activeReports: 12,
          totalReports: 45,
          recentActivity: 23
        })
      } catch (error) {
        console.error('대시보드 통계 로딩 오류:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDashboardStats()
  }, [])

  // 관리자 권한 확인
  if (!user || !permissions.canAccessAdminPanel()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-4">이 페이지에 접근하려면 관리자 권한이 필요합니다.</p>
          <Link href="/">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  const quickActions = [
    {
      title: '사용자 승인 관리',
      description: '대기 중인 가입 요청을 승인하거나 거절합니다',
      icon: UsersIcon,
      href: '/admin/approvals',
      color: 'bg-blue-500',
      count: stats.pendingApprovals
    },
    {
      title: '교회 관리',
      description: '회원가입 시 선택할 수 있는 교회 목록을 관리합니다',
      icon: BuildingOfficeIcon,
      href: '/admin/church-domains',
      color: 'bg-purple-500',
      count: 0
    },
    {
      title: '신고 관리',
      description: '사용자 신고를 검토하고 처리합니다',
      icon: ExclamationTriangleIcon,
      href: '/admin/reports',
      color: 'bg-red-500',
      count: stats.activeReports
    },
    {
      title: '감사 로그',
      description: '관리자 활동 내역을 확인합니다',
      icon: ChartBarIcon,
      href: '/admin/audit',
      color: 'bg-green-500',
      count: stats.recentActivity
    }
  ]
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드를 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-sm text-gray-600">시스템 관리 및 모니터링</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                관리자: {user.name}
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 사용자</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인 대기</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 신고</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeReports}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">최근 활동</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentActivity}</p>
              </div>
            </div>
          </Card>
        </div>
        
        {/* 빠른 액션 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <Link href={action.href}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                          <action.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {action.description}
                        </p>
                        {action.count > 0 && (
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {action.count}건 대기
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* 최근 활동 요약 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 승인 활동</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-900">김철수 사용자 승인</span>
                </div>
                <span className="text-xs text-gray-500">2시간 전</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-900">이영희 사용자 승인</span>
                </div>
                <span className="text-xs text-gray-500">5시간 전</span>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 신고 처리</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3" />
                  <span className="text-sm text-gray-900">스팸 게시글 신고 처리</span>
                </div>
                <span className="text-xs text-gray-500">1시간 전</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3" />
                  <span className="text-sm text-gray-900">부적절 댓글 신고 처리</span>
                </div>
                <span className="text-xs text-gray-500">3시간 전</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
