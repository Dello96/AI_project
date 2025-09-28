'use client'

import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types'
import { permissionManager, ResourceType, ActionType } from '@/lib/permissions'
import { permissionAuditManager } from '@/lib/permission-audit'

export function usePermissions() {
  const { user } = useAuthStore()

  // 사용자 역할 확인
  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user) return false
    
    const roleHierarchy: Record<UserRole, number> = {
      'member': 1,
      'leader': 2,
      'admin': 3
    }
    
    const userRoleLevel = roleHierarchy[user.role] || 0
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0
    
    return userRoleLevel >= requiredRoleLevel
  }

  // 게시판 권한
  const canCreatePost = (context?: any): boolean => {
    if (!user) return false
    const hasPermission = permissionManager.canCreatePost(user.role, context)
    
    // 감사 로그 기록
    permissionAuditManager.logPermissionCheck(
      user.id,
      user.role,
      'post',
      'create',
      context?.postId,
      context
    )
    
    return hasPermission
  }
  
  const canEditPost = (authorId: string, context?: any): boolean => {
    if (!user) return false
    const hasPermission = permissionManager.canEditPost(user.role, {
      ...context,
      userId: authorId
    })
    
    // 감사 로그 기록
    permissionAuditManager.logPermissionCheck(
      user.id,
      user.role,
      'post',
      'update',
      context?.postId,
      { ...context, authorId }
    )
    
    return hasPermission
  }
  
  const canDeletePost = (authorId: string, context?: any): boolean => {
    if (!user) return false
    const hasPermission = permissionManager.canDeletePost(user.role, {
      ...context,
      userId: authorId
    })
    
    // 감사 로그 기록
    permissionAuditManager.logPermissionCheck(
      user.id,
      user.role,
      'post',
      'delete',
      context?.postId,
      { ...context, authorId }
    )
    
    return hasPermission
  }
  
  const canModerateComments = (context?: any): boolean => {
    if (!user) return false
    const hasPermission = permissionManager.checkPermission(user.role, 'comment', 'moderate', context)
    
    // 감사 로그 기록
    permissionAuditManager.logPermissionCheck(
      user.id,
      user.role,
      'comment',
      'moderate',
      context?.commentId,
      context
    )
    
    return hasPermission
  }

  // 캘린더 권한
  const canCreateEvent = (context?: any): boolean => {
    if (!user) return false
    const hasPermission = permissionManager.canCreateEvent(user.role, context)
    
    // 감사 로그 기록
    permissionAuditManager.logPermissionCheck(
      user.id,
      user.role,
      'event',
      'create',
      context?.eventId,
      context
    )
    
    return hasPermission
  }
  
  const canEditEvent = (authorId: string, context?: any): boolean => {
    if (!user) return false
    const hasPermission = permissionManager.canEditEvent(user.role, {
      ...context,
      userId: authorId
    })
    
    // 감사 로그 기록
    permissionAuditManager.logPermissionCheck(
      user.id,
      user.role,
      'event',
      'update',
      context?.eventId,
      { ...context, authorId }
    )
    
    return hasPermission
  }
  
  const canDeleteEvent = (authorId: string, context?: any): boolean => {
    if (!user) return false
    const hasPermission = permissionManager.canDeleteEvent(user.role, {
      ...context,
      userId: authorId
    })
    
    // 감사 로그 기록
    permissionAuditManager.logPermissionCheck(
      user.id,
      user.role,
      'event',
      'delete',
      context?.eventId,
      { ...context, authorId }
    )
    
    return hasPermission
  }

  // 사용자 관리 권한
  const canManageUsers = (context?: any): boolean => {
    if (!user) return false
    const hasPermission = permissionManager.canManageUsers(user.role, context)
    
    // 감사 로그 기록
    permissionAuditManager.logPermissionCheck(
      user.id,
      user.role,
      'user',
      'manage',
      context?.userId,
      context
    )
    
    return hasPermission
  }
  
  const canApproveUsers = (context?: any): boolean => {
    if (!user) return false
    const hasPermission = permissionManager.canApproveUsers(user.role, context)
    
    // 감사 로그 기록
    permissionAuditManager.logPermissionCheck(
      user.id,
      user.role,
      'user',
      'approve',
      context?.userId,
      context
    )
    
    return hasPermission
  }
  
  const canViewUserProfiles = (context?: any): boolean => {
    if (!user) return false
    const hasPermission = permissionManager.checkPermission(user.role, 'user', 'read', context)
    
    // 감사 로그 기록
    permissionAuditManager.logPermissionCheck(
      user.id,
      user.role,
      'user',
      'read',
      context?.userId,
      context
    )
    
    return hasPermission
  }

  // 시스템 관리 권한
  const canAccessAdminPanel = (context?: any): boolean => {
    if (!user) return false
    const hasPermission = permissionManager.checkPermission(user.role, 'system', 'manage', context)
    
    // 감사 로그 기록
    permissionAuditManager.logPermissionCheck(
      user.id,
      user.role,
      'system',
      'manage',
      context?.systemId,
      context
    )
    
    return hasPermission
  }
  
  const canManageSystemSettings = (context?: any): boolean => {
    if (!user) return false
    const hasPermission = permissionManager.checkPermission(user.role, 'system', 'manage', context)
    
    // 감사 로그 기록
    permissionAuditManager.logPermissionCheck(
      user.id,
      user.role,
      'system',
      'manage',
      context?.settingId,
      context
    )
    
    return hasPermission
  }

  return {
    // 역할 확인
    hasRole,
    
    // 게시판 권한
    canCreatePost,
    canEditPost,
    canDeletePost,
    canModerateComments,
    
    // 캘린더 권한
    canCreateEvent,
    canEditEvent,
    canDeleteEvent,
    
    // 사용자 관리 권한
    canManageUsers,
    canApproveUsers,
    canViewUserProfiles,
    
    // 시스템 관리 권한
    canAccessAdminPanel,
    canManageSystemSettings
  }
}
