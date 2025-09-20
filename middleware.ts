import { NextRequest, NextResponse } from 'next/server'

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
  '/board',
  '/calendar',
  '/payment',
  '/api'
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
    
    // Edge Runtime에서는 JWT 검증을 하지 않고, 
    // 각 보호된 페이지에서 클라이언트 사이드에서 검증하도록 함
    return NextResponse.next()
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
