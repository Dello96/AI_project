import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== 인증 상태 확인 ===')
    
    // 1. Supabase 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('세션 확인 오류:', sessionError)
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: '세션 확인 실패',
        details: sessionError.message
      })
    }
    
    if (!session || !session.user) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        message: '인증되지 않은 사용자'
      })
    }
    
    // 2. 사용자 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('프로필 조회 오류:', profileError)
      // 프로필이 없어도 인증은 성공으로 처리
    }
    
    // 3. 사용자 정보 구성
    const userInfo = {
      id: session.user.id,
      email: session.user.email,
      name: profile?.name || session.user.user_metadata?.name || '사용자',
      phone: profile?.phone || session.user.user_metadata?.phone || null,
      role: profile?.role || 'user',
      isApproved: profile?.is_approved ?? true,
      provider: session.user.app_metadata?.provider || 'email',
      createdAt: session.user.created_at,
      lastSignIn: session.user.last_sign_in_at,
      emailConfirmed: !!session.user.email_confirmed_at
    }
    
    console.log('인증된 사용자:', userInfo)
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: userInfo,
      session: {
        accessToken: session.access_token ? '존재' : '없음',
        refreshToken: session.refresh_token ? '존재' : '없음',
        expiresAt: session.expires_at
      }
    })
    
  } catch (error) {
    console.error('인증 상태 확인 오류:', error)
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
