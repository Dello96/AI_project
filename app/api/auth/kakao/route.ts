import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const normalizeBaseUrl = (value?: string): string | null => {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const parsed = new URL(withProtocol)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return null
  }
}

const getRedirectUrl = (request: NextRequest): string => {
  // 배포/프리뷰 환경에서는 실제 요청 origin을 최우선으로 사용
  const requestOrigin = normalizeBaseUrl(request.nextUrl.origin)
  if (requestOrigin) {
    return `${requestOrigin}/auth/callback`
  }

  const envBaseUrl =
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL)

  if (envBaseUrl) {
    return `${envBaseUrl}/auth/callback`
  }

  return 'http://localhost:3000/auth/callback'
}

// 카카오 소셜 로그인 시작
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const redirectUrl = getRedirectUrl(request)
    
    
    // Supabase Auth의 카카오 소셜 로그인 URL 생성
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: redirectUrl
      }
    })

    if (error) {
      console.error('카카오 소셜 로그인 URL 생성 오류:', error)
      return NextResponse.json(
        { error: '카카오 로그인을 시작할 수 없습니다.' },
        { status: 500 }
      )
    }

    // 카카오 로그인 페이지로 리다이렉트
    return NextResponse.redirect(data.url)
  } catch (error) {
    console.error('카카오 소셜 로그인 오류:', error)
    return NextResponse.json(
      { error: '카카오 로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 카카오 소셜 로그인 처리 (POST 요청으로도 처리 가능)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const redirectUrl = getRedirectUrl(request)
    
    
    // Supabase Auth의 카카오 소셜 로그인 URL 생성
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: redirectUrl
      }
    })

    if (error) {
      console.error('카카오 소셜 로그인 URL 생성 오류:', error)
      return NextResponse.json(
        { error: '카카오 로그인을 시작할 수 없습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      redirectUrl: data.url
    })
  } catch (error) {
    console.error('카카오 소셜 로그인 오류:', error)
    return NextResponse.json(
      { error: '카카오 로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
