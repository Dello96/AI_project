'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ShieldExclamationIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { permissionAuditManager } from '@/lib/permission-audit'
import { AuditLog, SecurityEvent } from '@/lib/permission-audit'

interface AuditDashboardProps {
  className?: string
}

export default function AuditDashboard({ className = '' }: AuditDashboardProps) {
  const { user } = useAuth()
  const permissions = usePermissions()
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [filters, setFilters] = useState({
    logType: 'all',
    severity: 'all',
    resource: 'all',
    startDate: '',
    endDate: ''
  })
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    if (user && permissions.canAccessAdminPanel()) {
      loadAuditData()
    }
  }, [user, permissions, filters])

  // 감사 데이터 로드
  const loadAuditData = async () => {
    try {
      // 실제 구현에서는 API 호출
      const auditParams: any = {}
      
      if (filters.logType !== 'all') {
        auditParams.type = filters.logType
      }
      if (filters.severity !== 'all') {
        auditParams.severity = filters.severity
      }
      if (filters.resource !== 'all') {
        auditParams.resource = filters.resource
      }
      if (filters.startDate) {
        auditParams.startDate = new Date(filters.startDate)
      }
      if (filters.endDate) {
        auditParams.endDate = new Date(filters.endDate)
      }
      
      const logs = permissionAuditManager.getAuditLogs(auditParams, 100)

      const events = permissionAuditManager.getSecurityEvents({
        severity: filters.severity === 'all' ? undefined : filters.severity as any
      })

      setAuditLogs(logs)
      setSecurityEvents(events)
    } catch (error) {
      console.error('감사 데이터 로드 오류:', error)
    }
  }

  // 보안 이벤트 해결
  const resolveSecurityEvent = async (eventId: string) => {
    try {
      setIsResolving(true)
      
      if (!user) return
      
      permissionAuditManager.resolveSecurityEvent(eventId, user.id)
      
      // 목록 업데이트
      setSecurityEvents(prev => 
        prev.map(event => 
          event.id === eventId 
            ? { ...event, isResolved: true, resolvedAt: new Date(), resolvedBy: user.id }
            : event
        )
      )
      
      setSelectedEvent(null)
    } catch (error) {
      console.error('이벤트 해결 오류:', error)
    } finally {
      setIsResolving(false)
    }
  }

  // 시스템 보안 상태 요약
  const securitySummary = permissionAuditManager.getSystemSecuritySummary()

  // 최근 활동 요약
  const recentActivity = auditLogs.slice(0, 10)

  // 심각도별 색상
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 활동 타입별 아이콘
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'permission_check': return <EyeIcon className="w-4 h-4" />
      case 'permission_granted': return <CheckCircleIcon className="w-4 h-4" />
      case 'permission_revoked': return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'role_changed': return <ShieldExclamationIcon className="w-4 h-4" />
      default: return <ClockIcon className="w-4 h-4" />
    }
  }

  if (!user || !permissions.canAccessAdminPanel()) {
    return (
      <div className="text-center py-8">
        <ShieldExclamationIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">감사 대시보드에 접근할 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">권한 감사 대시보드</h1>
          <p className="text-gray-600">시스템 보안 상태와 사용자 활동을 모니터링합니다</p>
        </div>
        <Button onClick={loadAuditData} variant="outline">
          새로고침
        </Button>
      </div>

      {/* 보안 상태 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 보안 이벤트</p>
                <p className="text-2xl font-bold text-gray-900">{securitySummary.totalSecurityEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">미해결 이벤트</p>
                <p className="text-2xl font-bold text-gray-900">{securitySummary.unresolvedEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ShieldExclamationIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">심각한 이벤트</p>
                <p className="text-2xl font-bold text-gray-900">{securitySummary.criticalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">최근 활동</p>
                <p className="text-2xl font-bold text-gray-900">{securitySummary.recentActivity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>필터 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select
              value={filters.logType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, logType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="로그 타입 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 타입</SelectItem>
                <SelectItem value="permission_check">권한 확인</SelectItem>
                <SelectItem value="permission_granted">권한 부여</SelectItem>
                <SelectItem value="permission_revoked">권한 해제</SelectItem>
                <SelectItem value="role_changed">역할 변경</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.severity}
              onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="심각도 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 심각도</SelectItem>
                <SelectItem value="low">낮음</SelectItem>
                <SelectItem value="medium">보통</SelectItem>
                <SelectItem value="high">높음</SelectItem>
                <SelectItem value="critical">심각</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.resource}
              onValueChange={(value) => setFilters(prev => ({ ...prev, resource: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="리소스 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 리소스</SelectItem>
                <SelectItem value="post">게시판</SelectItem>
                <SelectItem value="event">일정</SelectItem>
                <SelectItem value="user">사용자</SelectItem>
                <SelectItem value="system">시스템</SelectItem>
              </SelectContent>
            </Select>
            
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-purple"
            />
            
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-purple"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 보안 이벤트 */}
        <Card>
          <CardHeader>
            <CardTitle>보안 이벤트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityEvents.slice(0, 10).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border ${
                    event.isResolved ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                          {event.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {event.timestamp.toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{event.description}</p>
                      <p className="text-xs text-gray-600">사용자: {event.userId}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      {!event.isResolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveSecurityEvent(event.id)}
                          disabled={isResolving}
                        >
                          해결
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 최근 활동 로그 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 활동 로그</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-400">
                      {getActivityIcon(log.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-600">
                        {log.userId} • {log.timestamp.toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 보안 이벤트 상세 모달 */}
      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium mb-4">보안 이벤트 상세</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이벤트 ID</label>
                  <p className="text-sm text-gray-900">{selectedEvent.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
                  <p className="text-sm text-gray-900">{selectedEvent.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">심각도</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedEvent.severity)}`}>
                    {selectedEvent.severity}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    selectedEvent.isResolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedEvent.isResolved ? '해결됨' : '미해결'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <p className="text-sm text-gray-900">{selectedEvent.description}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">발생 시간</label>
                <p className="text-sm text-gray-900">{selectedEvent.timestamp.toLocaleString('ko-KR')}</p>
              </div>
              
              {selectedEvent.isResolved && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">해결 시간</label>
                    <p className="text-sm text-gray-900">{selectedEvent.resolvedAt?.toLocaleString('ko-KR')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">해결자</label>
                    <p className="text-sm text-gray-900">{selectedEvent.resolvedBy}</p>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                {!selectedEvent.isResolved && (
                  <Button
                    onClick={() => resolveSecurityEvent(selectedEvent.id)}
                    disabled={isResolving}
                    className="flex-1"
                  >
                    {isResolving ? '해결 중...' : '이벤트 해결'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1"
                >
                  닫기
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
