import { UserRole } from '@/types'
import { ResourceType, ActionType, Permission } from './permissions'

// 감사 로그 타입
export type AuditLogType = 
  | 'permission_check' 
  | 'permission_granted' 
  | 'permission_revoked' 
  | 'role_changed' 
  | 'group_created' 
  | 'group_modified' 
  | 'suspicious_activity'

// 감사 로그 인터페이스
export interface AuditLog {
  id: string
  timestamp: Date
  type: AuditLogType
  userId: string
  userRole: UserRole
  action: string
  resource?: ResourceType
  resourceId?: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// 보안 이벤트 인터페이스
export interface SecurityEvent {
  id: string
  timestamp: Date
  type: 'permission_escalation' | 'unauthorized_access' | 'suspicious_pattern'
  userId: string
  description: string
  severity: 'medium' | 'high' | 'critical'
  isResolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

// 권한 감사 매니저 클래스
export class PermissionAuditManager {
  private static instance: PermissionAuditManager
  private auditLogs: AuditLog[] = []
  private securityEvents: SecurityEvent[] = []
  private suspiciousPatterns: Map<string, number> = new Map()
  private alertThresholds: Map<string, number> = new Map()

  private constructor() {
    this.initializeAlertThresholds()
  }

  static getInstance(): PermissionAuditManager {
    if (!PermissionAuditManager.instance) {
      PermissionAuditManager.instance = new PermissionAuditManager()
    }
    return PermissionAuditManager.instance
  }

  // 알림 임계값 초기화
  private initializeAlertThresholds() {
    this.alertThresholds.set('permission_check', 100) // 1분당 100회
    this.alertThresholds.set('unauthorized_access', 5) // 1분당 5회
    this.alertThresholds.set('role_change', 3) // 1분당 3회
  }

  // 권한 확인 로그
  logPermissionCheck(
    userId: string,
    userRole: UserRole,
    resource: ResourceType,
    action: ActionType,
    resourceId?: string,
    context?: any
  ): void {
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'permission_check',
      userId,
      userRole,
      action: `${resource}:${action}`,
      resource,
      resourceId,
      details: { context },
      severity: 'low'
    }

    this.auditLogs.push(log)
    this.checkSuspiciousPatterns(userId, 'permission_check')
  }

  // 권한 부여 로그
  logPermissionGranted(
    userId: string,
    userRole: UserRole,
    permission: Permission,
    grantedBy: string,
    context?: any
  ): void {
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'permission_granted',
      userId,
      userRole,
      action: `permission_granted:${permission.resource}:${permission.action}`,
      resource: permission.resource,
      details: { 
        permission, 
        grantedBy, 
        context,
        expiresAt: permission.conditions?.find(c => c.type === 'time')?.value
      },
      severity: 'medium'
    }

    this.auditLogs.push(log)
    this.checkSuspiciousPatterns(userId, 'permission_granted')
  }

  // 권한 해제 로그
  logPermissionRevoked(
    userId: string,
    userRole: UserRole,
    permission: Permission,
    revokedBy: string,
    reason?: string
  ): void {
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'permission_revoked',
      userId,
      userRole,
      action: `permission_revoked:${permission.resource}:${permission.action}`,
      resource: permission.resource,
      details: { permission, revokedBy, reason },
      severity: 'medium'
    }

    this.auditLogs.push(log)
  }

  // 역할 변경 로그
  logRoleChange(
    userId: string,
    oldRole: UserRole,
    newRole: UserRole,
    changedBy: string,
    reason?: string
  ): void {
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'role_changed',
      userId,
      userRole: newRole,
      action: `role_changed:${oldRole}->${newRole}`,
      details: { oldRole, newRole, changedBy, reason },
      severity: 'high'
    }

    this.auditLogs.push(log)
    this.checkSuspiciousPatterns(userId, 'role_change')
    
    // 권한 에스컬레이션 감지
    this.detectPermissionEscalation(userId, oldRole, newRole, changedBy)
  }

  // 권한 그룹 생성 로그
  logGroupCreated(
    groupId: string,
    groupName: string,
    createdBy: string,
    permissions: Permission[]
  ): void {
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'group_created',
      userId: createdBy,
      userRole: 'admin', // 그룹 생성은 관리자만 가능
      action: `group_created:${groupName}`,
      resourceId: groupId,
      details: { groupName, permissions },
      severity: 'medium'
    }

    this.auditLogs.push(log)
  }

  // 권한 그룹 수정 로그
  logGroupModified(
    groupId: string,
    groupName: string,
    modifiedBy: string,
    changes: Record<string, any>
  ): void {
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'group_modified',
      userId: modifiedBy,
      userRole: 'admin',
      action: `group_modified:${groupName}`,
      resourceId: groupId,
      details: { groupName, changes },
      severity: 'medium'
    }

    this.auditLogs.push(log)
  }

  // 의심스러운 활동 감지
  private checkSuspiciousPatterns(userId: string, activityType: string): void {
    const key = `${userId}:${activityType}`
    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000

    // 최근 1분간의 활동 횟수 확인
    const recentActivity = this.auditLogs.filter(
      log => 
        log.userId === userId && 
        log.type === activityType &&
        log.timestamp.getTime() > oneMinuteAgo
    ).length

    this.suspiciousPatterns.set(key, recentActivity)

    // 임계값 초과 시 보안 이벤트 생성
    const threshold = this.alertThresholds.get(activityType) || 100
    if (recentActivity > threshold) {
      this.createSecurityEvent(
        userId,
        'suspicious_pattern',
        `${activityType} 활동이 임계값(${threshold})을 초과했습니다. 현재: ${recentActivity}회`,
        'high'
      )
    }
  }

  // 권한 에스컬레이션 감지
  private detectPermissionEscalation(
    userId: string, 
    oldRole: UserRole, 
    newRole: UserRole, 
    changedBy: string
  ): void {
    const roleHierarchy: Record<UserRole, number> = {
      'member': 1,
      'leader': 2,
      'admin': 3
    }

    const oldLevel = roleHierarchy[oldRole] || 0
    const newLevel = roleHierarchy[newRole] || 0

    if (newLevel > oldLevel) {
      this.createSecurityEvent(
        userId,
        'permission_escalation',
        `권한 에스컬레이션 감지: ${oldRole}(${oldLevel}) -> ${newRole}(${newLevel})`,
        'critical'
      )
    }
  }

  // 보안 이벤트 생성
  private createSecurityEvent(
    userId: string,
    type: SecurityEvent['type'],
    description: string,
    severity: SecurityEvent['severity']
  ): void {
    const event: SecurityEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      type,
      userId,
      description,
      severity,
      isResolved: false
    }

    this.securityEvents.push(event)
    
    // 중요도가 높은 이벤트는 즉시 알림
    if (severity === 'critical') {
      this.sendSecurityAlert(event)
    }
  }

  // 보안 알림 발송
  private sendSecurityAlert(event: SecurityEvent): void {
    // 실제 구현에서는 이메일, 슬랙 등으로 알림 발송
    console.warn('🚨 보안 경고:', {
      type: event.type,
      userId: event.userId,
      description: event.description,
      severity: event.severity,
      timestamp: event.timestamp
    })
  }

  // 감사 로그 조회
  getAuditLogs(
    filters?: {
      userId?: string
      type?: AuditLogType
      resource?: ResourceType
      startDate?: Date
      endDate?: Date
      severity?: AuditLog['severity']
    },
    limit: number = 100
  ): AuditLog[] {
    let filteredLogs = [...this.auditLogs]

    if (filters?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId)
    }

    if (filters?.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filters.type)
    }

    if (filters?.resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === filters.resource)
    }

    if (filters?.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!)
    }

    if (filters?.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!)
    }

    if (filters?.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === filters.severity)
    }

    return filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // 보안 이벤트 조회
  getSecurityEvents(
    filters?: {
      userId?: string
      type?: SecurityEvent['type']
      severity?: SecurityEvent['severity']
      isResolved?: boolean
    }
  ): SecurityEvent[] {
    let filteredEvents = [...this.securityEvents]

    if (filters?.userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === filters.userId)
    }

    if (filters?.type) {
      filteredEvents = filteredEvents.filter(event => event.type === filters.type)
    }

    if (filters?.severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === filters.severity)
    }

    if (filters?.isResolved !== undefined) {
      filteredEvents = filteredEvents.filter(event => event.isResolved === filters.isResolved)
    }

    return filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // 보안 이벤트 해결
  resolveSecurityEvent(eventId: string, resolvedBy: string): void {
    const event = this.securityEvents.find(e => e.id === eventId)
    if (event) {
      event.isResolved = true
      event.resolvedAt = new Date()
      event.resolvedBy = resolvedBy
    }
  }

  // 사용자 활동 요약
  getUserActivitySummary(userId: string, days: number = 30): {
    totalActions: number
    permissionChecks: number
    permissionChanges: number
    roleChanges: number
    securityEvents: number
  } {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const userLogs = this.auditLogs.filter(
      log => log.userId === userId && log.timestamp >= startDate
    )

    const userEvents = this.securityEvents.filter(
      event => event.userId === userId && event.timestamp >= startDate
    )

    return {
      totalActions: userLogs.length,
      permissionChecks: userLogs.filter(log => log.type === 'permission_check').length,
      permissionChanges: userLogs.filter(log => 
        log.type === 'permission_granted' || log.type === 'permission_revoked'
      ).length,
      roleChanges: userLogs.filter(log => log.type === 'role_changed').length,
      securityEvents: userEvents.length
    }
  }

  // 시스템 보안 상태 요약
  getSystemSecuritySummary(): {
    totalSecurityEvents: number
    unresolvedEvents: number
    criticalEvents: number
    recentActivity: number
  } {
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    return {
      totalSecurityEvents: this.securityEvents.length,
      unresolvedEvents: this.securityEvents.filter(e => !e.isResolved).length,
      criticalEvents: this.securityEvents.filter(e => e.severity === 'critical').length,
      recentActivity: this.auditLogs.filter(log => log.timestamp > oneHourAgo).length
    }
  }

  // ID 생성
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  // 로그 내보내기
  exportAuditLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'Type', 'UserID', 'UserRole', 'Action', 'Resource', 'Severity']
      const rows = this.auditLogs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.type,
        log.userId,
        log.userRole,
        log.action,
        log.resource || '',
        log.severity
      ])
      
      return [headers, ...rows]
        .map(row => row.join(','))
        .join('\n')
    }

    return JSON.stringify(this.auditLogs, null, 2)
  }
}

// 싱글톤 인스턴스
export const permissionAuditManager = PermissionAuditManager.getInstance()
