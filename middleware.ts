import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 공개 라우트는 인증 검사 제외
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // 보호된 라우트인지 확인
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute) {
    const res = NextResponse.next()
    
    // Supabase 미들웨어 클라이언트 생성
    // 이는 쿠키에서 Supabase 세션을 자동으로 읽고 갱신합니다
    try {
      const supabase = createMiddlewareClient({ req: request, res })
      
      // 세션 확인
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // 세션이 없으면 로그인 페이지로 리다이렉트
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
      
      // 세션이 있으면 계속 진행
      return res
    } catch (error) {
      console.error('Middleware 인증 오류:', error)
      
      // 오류 발생 시 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
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
