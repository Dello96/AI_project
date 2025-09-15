import { supabase } from './supabase'
import { verifyJWT } from './auth-tokens'

export interface AuthUser {
  id: string
  email: string
  role: 'user' | 'leader' | 'admin'
  isApproved: boolean
}

export interface Post {
  id: string
  author_id: string
  title: string
  content: string
  category: string
  is_anonymous: boolean
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

/**
 * JWT 토큰에서 사용자 정보를 추출합니다
 * @param authHeader Authorization 헤더
 * @returns 사용자 정보 또는 null
 */
export async function extractUserFromToken(authHeader: string | null): Promise<AuthUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const payload = verifyJWT(token)
    
    if (!payload) {
      return null
    }

    // 사용자 프로필 조회
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, is_approved')
      .eq('id', payload.sub)
      .single()

    if (error || !userProfile) {
      return null
    }

    return {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      isApproved: userProfile.is_approved
    }
  } catch (error) {
    console.error('토큰 검증 오류:', error)
    return null
  }
}

/**
 * 사용자가 인증되었는지 확인합니다
 * @param user 사용자 정보
 * @returns 인증된 사용자인지 여부
 */
export function isAuthenticated(user: AuthUser | null): user is AuthUser {
  return user !== null && user.isApproved
}

/**
 * 사용자가 관리자인지 확인합니다
 * @param user 사용자 정보
 * @returns 관리자인지 여부
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user !== null && user.role === 'admin'
}

/**
 * 사용자가 리더 이상인지 확인합니다
 * @param user 사용자 정보
 * @returns 리더 이상인지 여부
 */
export function isLeaderOrAdmin(user: AuthUser | null): boolean {
  return user !== null && (user.role === 'leader' || user.role === 'admin')
}

/**
 * 게시글 작성 권한을 확인합니다
 * @param user 사용자 정보
 * @returns 게시글 작성 권한이 있는지 여부
 */
export function canCreatePost(user: AuthUser | null): boolean {
  return isAuthenticated(user)
}

/**
 * 게시글 수정 권한을 확인합니다
 * @param user 사용자 정보
 * @param post 게시글 정보
 * @returns 게시글 수정 권한이 있는지 여부
 */
export function canUpdatePost(user: AuthUser | null, post: Post): boolean {
  if (!isAuthenticated(user)) {
    return false
  }

  // 관리자는 모든 게시글 수정 가능
  if (isAdmin(user)) {
    return true
  }

  // 작성자는 자신의 게시글만 수정 가능
  return user.id === post.author_id
}

/**
 * 게시글 삭제 권한을 확인합니다
 * @param user 사용자 정보
 * @param post 게시글 정보
 * @returns 게시글 삭제 권한이 있는지 여부
 */
export function canDeletePost(user: AuthUser | null, post: Post): boolean {
  if (!isAuthenticated(user)) {
    return false
  }

  // 관리자는 모든 게시글 삭제 가능
  if (isAdmin(user)) {
    return true
  }

  // 작성자는 자신의 게시글만 삭제 가능
  return user.id === post.author_id
}

/**
 * 공지사항 작성 권한을 확인합니다
 * @param user 사용자 정보
 * @returns 공지사항 작성 권한이 있는지 여부
 */
export function canCreateNotice(user: AuthUser | null): boolean {
  return isAuthenticated(user) && isLeaderOrAdmin(user)
}

/**
 * 게시글 ID로 게시글 정보를 조회합니다
 * @param postId 게시글 ID
 * @returns 게시글 정보 또는 null
 */
export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (error || !post) {
      return null
    }

    return post
  } catch (error) {
    console.error('게시글 조회 오류:', error)
    return null
  }
}

/**
 * 인증 및 권한 확인을 위한 미들웨어
 * @param request NextRequest 객체
 * @param requiredAuth 인증이 필요한지 여부
 * @returns 사용자 정보 또는 null
 */
export async function requireAuth(
  request: Request, 
  requiredAuth: boolean = true
): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization')
  const user = await extractUserFromToken(authHeader)

  if (requiredAuth && !isAuthenticated(user)) {
    return null
  }

  return user
}

/**
 * 게시글 수정/삭제 권한 확인을 위한 미들웨어
 * @param request NextRequest 객체
 * @param postId 게시글 ID
 * @param action 수행할 액션 ('update' | 'delete')
 * @returns 권한이 있는지 여부
 */
export async function requirePostPermission(
  request: Request,
  postId: string,
  action: 'update' | 'delete'
): Promise<{ user: AuthUser; post: Post } | null> {
  const user = await requireAuth(request)
  if (!user) {
    return null
  }

  const post = await getPostById(postId)
  if (!post) {
    return null
  }

  const hasPermission = action === 'update' 
    ? canUpdatePost(user, post)
    : canDeletePost(user, post)

  if (!hasPermission) {
    return null
  }

  return { user, post }
}
