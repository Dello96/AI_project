'use client'

import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { UserRole } from '@/types'

interface PermissionGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  fallback?: React.ReactNode
  checkPermission?: () => boolean
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredRole,
  fallback,
  checkPermission
}) => {
  const permissions = usePermissions()
  
  let hasAccess = false
  
  if (checkPermission) {
    hasAccess = checkPermission()
  } else if (requiredRole) {
    hasAccess = permissions.hasRole(requiredRole)
  } else {
    hasAccess = true
  }

  if (!hasAccess) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="p-4 text-center text-neutral-500">
        <p>이 기능에 접근할 권한이 없습니다.</p>
      </div>
    )
  }

  return <>{children}</>
}

// 편의를 위한 특정 권한 가드들
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGuard requiredRole="admin" fallback={fallback}>
    {children}
  </PermissionGuard>
)

export const LeaderOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGuard requiredRole="leader" fallback={fallback}>
    {children}
  </PermissionGuard>
)

export const MemberOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGuard requiredRole="member" fallback={fallback}>
    {children}
  </PermissionGuard>
)
