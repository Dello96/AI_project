import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
  // 1) 프록시 헤더 기반 공개 origin (Vercel/Proxy 환경에서 가장 신뢰 가능)
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedProto && forwardedHost) {
    const forwardedOrigin = normalizeBaseUrl(`${forwardedProto}://${forwardedHost}`)
    if (forwardedOrigin) {
      return `${forwardedOrigin}/auth/callback`
    }
  }

  // 2) 배포 URL 환경 변수
  const vercelUrl = normalizeBaseUrl(process.env.VERCEL_URL)
  if (vercelUrl) {
    return `${vercelUrl}/auth/callback`
  }

  // 3) 명시된 사이트 URL
  const envBaseUrl =
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL)
  if (envBaseUrl) {
    return `${envBaseUrl}/auth/callback`
  }

  // 4) 요청 origin
  const requestOrigin = normalizeBaseUrl(request.nextUrl.origin)
  if (requestOrigin) {
    return `${requestOrigin}/auth/callback`
  }

  // 5) 개발 환경 fallback
  return 'http://localhost:3000/auth/callback'
}

const createAuthClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase OAuth 환경 변수가 설정되지 않았습니다.')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// 카카오 소셜 로그인 시작
export async function GET(request: NextRequest) {
  try {
    const supabase = createAuthClient()
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
    const supabase = createAuthClient()
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
