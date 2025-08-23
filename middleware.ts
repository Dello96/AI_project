import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

// 보호된 경로 설정
const protectedPaths = [
  '/api/boards',
  '/api/events',
  '/api/notifications',
  '/board/write',
  '/calendar/add',
  '/admin'
]

// 관리자 전용 경로
const adminOnlyPaths = [
  '/admin',
  '/api/admin'
]

// 리더 이상 권한 필요 경로
const leaderPaths = [
  '/calendar/add',
  '/api/events'
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // 보호된 경로인지 확인
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  )

  // 보호된 경로에 대한 인증 확인
  if (isProtectedPath) {
    if (error || !session) {
      // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: '인증이 필요합니다.' },
          { status: 401 }
        )
      } else {
        url.pathname = '/'
        url.searchParams.set('auth', 'required')
        return NextResponse.redirect(url)
      }
    }

    // 사용자 역할 정보 조회
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, is_approved')
      .eq('id', session.user.id)
      .single()

    // 사용자가 승인되지 않은 경우
    if (!userProfile?.is_approved) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: '계정 승인이 필요합니다.' },
          { status: 403 }
        )
      } else {
        url.pathname = '/'
        url.searchParams.set('error', 'approval_required')
        return NextResponse.redirect(url)
      }
    }

    const userRole = userProfile?.role || 'member'

    // 관리자 전용 경로 확인
    const isAdminOnlyPath = adminOnlyPaths.some(path => 
      pathname.startsWith(path)
    )
    
    if (isAdminOnlyPath && userRole !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: '관리자 권한이 필요합니다.' },
          { status: 403 }
        )
      } else {
        url.pathname = '/'
        url.searchParams.set('error', 'admin_required')
        return NextResponse.redirect(url)
      }
    }

    // 리더 이상 권한 경로 확인
    const isLeaderPath = leaderPaths.some(path => 
      pathname.startsWith(path)
    )
    
    if (isLeaderPath && !['leader', 'admin'].includes(userRole)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: '리더 권한이 필요합니다.' },
          { status: 403 }
        )
      } else {
        url.pathname = '/'
        url.searchParams.set('error', 'leader_required')
        return NextResponse.redirect(url)
      }
    }

    // 사용자 역할을 헤더에 추가 (API에서 사용할 수 있도록)
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-role', userRole)
    requestHeaders.set('x-user-id', session.user.id)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
