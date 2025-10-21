import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { logAuthAction } from '@/lib/auth-tokens'

export async function POST(request: NextRequest) {
  try {
    // Supabase Auth 세션 종료
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('Supabase 로그아웃 오류:', signOutError)
    }
    
    // 감사 로그 기록
    logAuthAction({
      email: 'unknown',
      action: 'logout',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { reason: 'user_logout' }
    })
    
    // Supabase가 자동으로 localStorage의 세션을 제거하므로 별도의 쿠키 삭제 불필요
    return NextResponse.json(
      { 
        success: true,
        message: '로그아웃되었습니다.'
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('로그아웃 API 오류:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: '로그아웃 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}
