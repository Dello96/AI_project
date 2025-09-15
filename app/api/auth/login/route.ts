import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { 
  createJWT, 
  createRefreshToken, 
  setAuthCookies, 
  checkRateLimit, 
  recordLoginFailure, 
  resetLoginAttempts,
  logAuthAction 
} from '@/lib/auth-tokens'

// 입력 검증 스키마
const LoginSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.')
})

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json()
    const parsed = LoginSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: parsed.error.issues },
        { status: 400 }
      )
    }
    
    const { email, password } = parsed.data
    
    // 레이트 리밋 체크
    const rateLimit = checkRateLimit(email)
    if (!rateLimit.allowed) {
      const blockedUntil = new Date(rateLimit.blockedUntil!)
      const remainingTime = Math.ceil((rateLimit.blockedUntil! - Date.now()) / 1000 / 60)
      
      logAuthAction({
        email,
        action: 'login_failure',
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { reason: 'rate_limited', blockedUntil: blockedUntil.toISOString() }
      })
      
      return NextResponse.json(
        { 
          error: `로그인 시도 횟수를 초과했습니다. ${remainingTime}분 후에 다시 시도해주세요.`,
          blockedUntil: blockedUntil.toISOString(),
          remainingTime
        },
        { status: 429 }
      )
    }
    
    // Supabase Auth로 로그인 시도
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError) {
      // 로그인 실패 기록
      recordLoginFailure(email)
      
      logAuthAction({
        email,
        action: 'login_failure',
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { reason: authError.message }
      })
      
      return NextResponse.json(
        { 
          error: '이메일 또는 비밀번호가 올바르지 않습니다.',
          remainingAttempts: rateLimit.remainingAttempts - 1
        },
        { status: 401 }
      )
    }
    
    if (!authData.user) {
      recordLoginFailure(email)
      
      logAuthAction({
        email,
        action: 'login_failure',
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { reason: 'no_user_returned' }
      })
      
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 401 }
      )
    }
    
    // 사용자 프로필 정보 조회 (선택적)
    let profile = null
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    if (profileData) {
      profile = profileData
    }
    
    // 프로필이 없는 경우 기본값 사용
    const userRole = profile?.role || 'user'
    const isApproved = profile?.is_approved ?? true // 기본적으로 승인된 것으로 처리
    const userName = profile?.name || authData.user.user_metadata?.name || '사용자'
    
    // 승인 상태 확인 (프로필이 있는 경우에만)
    if (profile && !profile.is_approved) {
      logAuthAction({
        email,
        action: 'login_failure',
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { reason: 'not_approved' }
      })
      
      return NextResponse.json(
        { error: '관리자 승인을 기다리고 있습니다.' },
        { status: 403 }
      )
    }
    
    // JWT 토큰 생성
    const accessToken = createJWT(
      { 
        sub: authData.user.id, 
        email: authData.user.email,
        role: userRole,
        isApproved
      },
      '15m'
    )
    
    const refreshToken = createRefreshToken()
    
    // 리프레시 토큰을 데이터베이스에 저장
    const { error: tokenError } = await supabase
      .from('refresh_tokens')
      .upsert({
        user_id: authData.user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일
      })
    
    if (tokenError) {
      console.error('리프레시 토큰 저장 오류:', tokenError)
      // 토큰 저장 실패해도 로그인은 성공으로 처리
    }
    
    // 로그인 성공 시 시도 횟수 초기화
    resetLoginAttempts(email)
    
    // 감사 로그 기록
    logAuthAction({
      email,
      action: 'login_success',
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { userId: authData.user.id, role: userRole }
    })
    
    // 응답 생성 (Supabase Auth 세션을 직접 사용)
    const response = NextResponse.json(
      { 
        success: true,
        message: '로그인에 성공했습니다.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: userName,
          phone: profile?.phone || authData.user.user_metadata?.phone || null,
          churchDomain: profile?.church_domain_id || authData.user.user_metadata?.churchDomain || '',
          role: userRole,
          isApproved,
          createdAt: new Date(authData.user.created_at || new Date()),
          updatedAt: new Date(authData.user.updated_at || new Date())
        }
      },
      { status: 200 }
    )
    
    // Supabase Auth 세션 쿠키 설정
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Supabase Auth 쿠키 설정
      response.cookies.set('sb-access-token', session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 // 15분
      })
      
      response.cookies.set('sb-refresh-token', session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7일
      })
    }
    
    return response
    
  } catch (error) {
    console.error('로그인 API 오류:', error)
    
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
