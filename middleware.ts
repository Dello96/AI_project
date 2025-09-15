import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth-tokens'

// 보호된 라우트 패턴
const protectedRoutes = [
  '/admin',
  '/profile'
]

// 인증이 필요하지 않은 공개 라우트
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/refresh'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 공개 라우트는 인증 검사 제외
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // 보호된 라우트인지 확인
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute) {
    // 쿠키에서 액세스 토큰 확인
    const accessToken = request.cookies.get('access_token')?.value
    
    if (!accessToken) {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // JWT 토큰 검증
    const payload = verifyJWT(accessToken)
    
    if (!payload) {
      // 토큰이 유효하지 않으면 쿠키 삭제하고 로그인 페이지로 리다이렉트
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('access_token')
      response.cookies.delete('refresh_token')
      return response
    }
    
    // 토큰이 유효하면 요청 헤더에 사용자 정보 추가
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.sub)
    requestHeaders.set('x-user-email', payload.email)
    requestHeaders.set('x-user-role', payload.role)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
