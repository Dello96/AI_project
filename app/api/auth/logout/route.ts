import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { 
  getAuthCookies, 
  clearAuthCookies,
  logAuthAction 
} from '@/lib/auth-tokens'

export async function POST(request: NextRequest) {
  try {
    // 쿠키에서 리프레시 토큰 가져오기
    const { refreshToken } = getAuthCookies(request)
    
    if (refreshToken) {
      // 데이터베이스에서 리프레시 토큰 무효화
      const { error: deleteError } = await supabase
        .from('refresh_tokens')
        .delete()
        .eq('token', refreshToken)
      
      if (deleteError) {
        console.error('리프레시 토큰 삭제 오류:', deleteError)
      }
      
      // Supabase Auth 세션도 종료
      try {
        await supabase.auth.signOut()
      } catch (signOutError) {
        console.error('Supabase 로그아웃 오류:', signOutError)
      }
      
      // 감사 로그 기록
      logAuthAction({
        email: 'unknown',
        action: 'logout',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { reason: 'user_logout', tokenRevoked: true }
      })
    }
    
    // 응답 생성
    const response = NextResponse.json(
      { 
        success: true,
        message: '로그아웃되었습니다.'
      },
      { status: 200 }
    )
    
    // 쿠키 삭제
    return clearAuthCookies(response)
    
  } catch (error) {
    console.error('로그아웃 API 오류:', error)
    
    // 오류가 발생해도 쿠키는 삭제
    const response = NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    )
    
    return clearAuthCookies(response)
  }
}
