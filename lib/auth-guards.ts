import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { UserRole } from '@/types'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  isApproved: boolean
}

// 인증된 사용자 정보 조회
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return null
    }

    // 사용자 프로필 조회
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, is_approved, email, name')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return null
    }

    return {
      id: session.user.id,
      email: userProfile.email,
      role: userProfile.role as UserRole,
      isApproved: userProfile.is_approved
    }
  } catch (error) {
    console.error('인증 사용자 조회 오류:', error)
    return null
  }
}

// 최소 권한 레벨 확인
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    'member': 1,
    'leader': 2,
    'admin': 3
  }
  
  const userLevel = roleHierarchy[userRole] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

// 권한 확인 데코레이터
export function requireAuth(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return Response.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    if (!user.isApproved) {
      return Response.json(
        { error: '계정 승인이 필요합니다.' },
        { status: 403 }
      )
    }

    // 사용자 정보를 context에 추가
    const newContext = { ...context, user }
    return handler(request, newContext)
  }
}

// 특정 역할 이상 권한 필요
export function requireRole(requiredRole: UserRole) {
  return function(handler: Function) {
    return async (request: NextRequest, context?: any) => {
      const user = await getAuthenticatedUser(request)
      
      if (!user) {
        return Response.json(
          { error: '인증이 필요합니다.' },
          { status: 401 }
        )
      }

      if (!user.isApproved) {
        return Response.json(
          { error: '계정 승인이 필요합니다.' },
          { status: 403 }
        )
      }

      if (!hasMinimumRole(user.role, requiredRole)) {
        return Response.json(
          { error: `${requiredRole} 이상의 권한이 필요합니다.` },
          { status: 403 }
        )
      }

      // 사용자 정보를 context에 추가
      const newContext = { ...context, user }
      return handler(request, newContext)
    }
  }
}

// 리소스 소유자 또는 관리자만 접근 가능
export function requireOwnershipOrAdmin(
  getResourceOwnerId: (request: NextRequest, context: any) => Promise<string | null>
) {
  return function(handler: Function) {
    return async (request: NextRequest, context?: any) => {
      const user = await getAuthenticatedUser(request)
      
      if (!user) {
        return Response.json(
          { error: '인증이 필요합니다.' },
          { status: 401 }
        )
      }

      if (!user.isApproved) {
        return Response.json(
          { error: '계정 승인이 필요합니다.' },
          { status: 403 }
        )
      }

      // 관리자는 모든 리소스에 접근 가능
      if (user.role === 'admin') {
        const newContext = { ...context, user }
        return handler(request, newContext)
      }

      // 리소스 소유자 확인
      const resourceOwnerId = await getResourceOwnerId(request, context)
      
      if (!resourceOwnerId || resourceOwnerId !== user.id) {
        return Response.json(
          { error: '접근 권한이 없습니다.' },
          { status: 403 }
        )
      }

      const newContext = { ...context, user }
      return handler(request, newContext)
    }
  }
}
