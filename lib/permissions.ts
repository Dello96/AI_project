import { UserRole } from '@/types'

// 리소스 타입 정의
export type ResourceType = 
  | 'post' 
  | 'event' 
  | 'user' 
  | 'comment' 
  | 'file' 
  | 'notification'
  | 'system'

// 액션 타입 정의
export type ActionType = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'moderate' 
  | 'approve' 
  | 'manage'

// 권한 인터페이스
export interface Permission {
  resource: ResourceType
  action: ActionType
  conditions?: PermissionCondition[]
}

// 권한 조건 인터페이스
export interface PermissionCondition {
  type: 'ownership' | 'category' | 'time' | 'status' | 'custom'
  value: any
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
}

// 권한 그룹 인터페이스
export interface PermissionGroup {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

// 사용자 권한 인터페이스
export interface UserPermission {
  userId: string
  role: UserRole
  customPermissions: Permission[]
  permissionGroups: string[]
  grantedAt: Date
  expiresAt?: Date
  grantedBy: string
}

// 권한 매트릭스 클래스
export class PermissionMatrix {
  private static instance: PermissionMatrix
  private permissions: Map<string, Permission[]> = new Map()

  private constructor() {
    this.initializeDefaultPermissions()
  }

  static getInstance(): PermissionMatrix {
    if (!PermissionMatrix.instance) {
      PermissionMatrix.instance = new PermissionMatrix()
    }
    return PermissionMatrix.instance
  }

  // 기본 권한 초기화
  private initializeDefaultPermissions() {
    // 일반 회원 권한
    const memberPermissions: Permission[] = [
      { resource: 'post', action: 'read' },
      { resource: 'post', action: 'create' },
      { resource: 'event', action: 'read' },
      { resource: 'comment', action: 'read' },
      { resource: 'comment', action: 'create' },
      { resource: 'file', action: 'read' },
      { resource: 'notification', action: 'read' },
    ]

    // 리더 권한
    const leaderPermissions: Permission[] = [
      ...memberPermissions,
      { resource: 'post', action: 'moderate' },
      { resource: 'event', action: 'create' },
      { resource: 'event', action: 'update' },
      { resource: 'comment', action: 'moderate' },
      { resource: 'user', action: 'read' },
      { resource: 'notification', action: 'create' },
    ]

    // 관리자 권한
    const adminPermissions: Permission[] = [
      ...leaderPermissions,
      { resource: 'post', action: 'delete' },
      { resource: 'event', action: 'delete' },
      { resource: 'user', action: 'manage' },
      { resource: 'user', action: 'approve' },
      { resource: 'system', action: 'manage' },
      { resource: 'file', action: 'manage' },
    ]

    this.permissions.set('member', memberPermissions)
    this.permissions.set('leader', leaderPermissions)
    this.permissions.set('admin', adminPermissions)
  }

  // 권한 확인
  hasPermission(
    userRole: UserRole,
    resource: ResourceType,
    action: ActionType,
    context?: any
  ): boolean {
    const rolePermissions = this.permissions.get(userRole) || []
    
    // 기본 권한 확인
    const hasBasicPermission = rolePermissions.some(
      permission => 
        permission.resource === resource && 
        permission.action === action
    )

    if (!hasBasicPermission) return false

    // 조건부 권한 확인
    const permission = rolePermissions.find(
      p => p.resource === resource && p.action === action
    )

    if (!permission?.conditions) return true

    return this.evaluateConditions(permission.conditions, context)
  }

  // 조건 평가
  private evaluateConditions(conditions: PermissionCondition[], context: any): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'ownership':
          return this.evaluateOwnershipCondition(condition, context)
        case 'category':
          return this.evaluateCategoryCondition(condition, context)
        case 'time':
          return this.evaluateTimeCondition(condition, context)
        case 'status':
          return this.evaluateStatusCondition(condition, context)
        case 'custom':
          return this.evaluateCustomCondition(condition, context)
        default:
          return false
      }
    })
  }

  // 소유권 조건 평가
  private evaluateOwnershipCondition(condition: PermissionCondition, context: any): boolean {
    if (condition.operator === 'equals') {
      return context.userId === condition.value
    }
    return false
  }

  // 카테고리 조건 평가
  private evaluateCategoryCondition(condition: PermissionCondition, context: any): boolean {
    if (condition.operator === 'equals') {
      return context.category === condition.value
    }
    return false
  }

  // 시간 조건 평가
  private evaluateTimeCondition(condition: PermissionCondition, context: any): boolean {
    const now = new Date()
    const targetTime = new Date(condition.value)
    
    switch (condition.operator) {
      case 'greater_than':
        return now > targetTime
      case 'less_than':
        return now < targetTime
      default:
        return false
    }
  }

  // 상태 조건 평가
  private evaluateStatusCondition(condition: PermissionCondition, context: any): boolean {
    if (condition.operator === 'equals') {
      return context.status === condition.value
    }
    return false
  }

  // 커스텀 조건 평가
  private evaluateCustomCondition(condition: PermissionCondition, context: any): boolean {
    // 커스텀 조건 평가 로직 구현
    return true
  }

  // 사용자 정의 권한 추가
  addCustomPermission(userId: string, permission: Permission): void {
    const userKey = `user_${userId}`
    const existingPermissions = this.permissions.get(userKey) || []
    existingPermissions.push(permission)
    this.permissions.set(userKey, existingPermissions)
  }

  // 사용자 정의 권한 제거
  removeCustomPermission(userId: string, permission: Permission): void {
    const userKey = `user_${userId}`
    const existingPermissions = this.permissions.get(userKey) || []
    const filteredPermissions = existingPermissions.filter(
      p => !(p.resource === permission.resource && p.action === permission.action)
    )
    this.permissions.set(userKey, filteredPermissions)
  }

  // 권한 그룹 생성
  createPermissionGroup(group: Omit<PermissionGroup, 'id' | 'createdAt' | 'updatedAt'>): PermissionGroup {
    const newGroup: PermissionGroup = {
      ...group,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.permissions.set(`group_${newGroup.id}`, group.permissions)
    return newGroup
  }

  // 권한 그룹에 사용자 할당
  assignUserToGroup(userId: string, groupId: string): void {
    const userKey = `user_${userId}`
    const groupKey = `group_${groupId}`
    const groupPermissions = this.permissions.get(groupKey) || []
    const userPermissions = this.permissions.get(userKey) || []
    
    // 그룹 권한을 사용자에게 추가
    const combinedPermissions = [...userPermissions, ...groupPermissions]
    this.permissions.set(userKey, combinedPermissions)
  }

  // 사용자 권한 조회
  getUserPermissions(userId: string, role: UserRole): Permission[] {
    const rolePermissions = this.permissions.get(role) || []
    const userKey = `user_${userId}`
    const customPermissions = this.permissions.get(userKey) || []
    
    return [...rolePermissions, ...customPermissions]
  }

  // 권한 검증
  validatePermissions(permissions: Permission[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    permissions.forEach(permission => {
      if (!permission.resource || !permission.action) {
        errors.push('권한에 리소스와 액션이 필요합니다.')
      }
      
      if (permission.conditions) {
        permission.conditions.forEach(condition => {
          if (!condition.type || !condition.operator) {
            errors.push('권한 조건에 타입과 연산자가 필요합니다.')
          }
        })
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// 권한 매니저 클래스
export class PermissionManager {
  private matrix: PermissionMatrix

  constructor() {
    this.matrix = PermissionMatrix.getInstance()
  }

  // 권한 확인
  checkPermission(
    userRole: UserRole,
    resource: ResourceType,
    action: ActionType,
    context?: any
  ): boolean {
    return this.matrix.hasPermission(userRole, resource, action, context)
  }

  // 게시판 권한 확인
  canCreatePost(userRole: UserRole, context?: any): boolean {
    return this.checkPermission(userRole, 'post', 'create', context)
  }

  canEditPost(userRole: UserRole, context?: any): boolean {
    return this.checkPermission(userRole, 'post', 'update', context)
  }

  canDeletePost(userRole: UserRole, context?: any): boolean {
    return this.checkPermission(userRole, 'post', 'delete', context)
  }

  canModeratePost(userRole: UserRole, context?: any): boolean {
    return this.checkPermission(userRole, 'post', 'moderate', context)
  }

  // 일정 권한 확인
  canCreateEvent(userRole: UserRole, context?: any): boolean {
    return this.checkPermission(userRole, 'event', 'create', context)
  }

  canEditEvent(userRole: UserRole, context?: any): boolean {
    return this.checkPermission(userRole, 'event', 'update', context)
  }

  canDeleteEvent(userRole: UserRole, context?: any): boolean {
    return this.checkPermission(userRole, 'event', 'delete', context)
  }

  // 사용자 관리 권한 확인
  canManageUsers(userRole: UserRole, context?: any): boolean {
    return this.checkPermission(userRole, 'user', 'manage', context)
  }

  canApproveUsers(userRole: UserRole, context?: any): boolean {
    return this.checkPermission(userRole, 'user', 'approve', context)
  }

  // 시스템 관리 권한 확인
  canManageSystem(userRole: UserRole, context?: any): boolean {
    return this.checkPermission(userRole, 'system', 'manage', context)
  }

  // 권한 그룹 생성
  createGroup(group: Omit<PermissionGroup, 'id' | 'createdAt' | 'updatedAt'>): PermissionGroup {
    return this.matrix.createPermissionGroup(group)
  }

  // 사용자에게 권한 그룹 할당
  assignGroupToUser(userId: string, groupId: string): void {
    this.matrix.assignUserToGroup(userId, groupId)
  }

  // 사용자 권한 조회
  getUserPermissions(userId: string, role: UserRole): Permission[] {
    return this.matrix.getUserPermissions(userId, role)
  }
}

// 싱글톤 인스턴스
export const permissionManager = new PermissionManager()
