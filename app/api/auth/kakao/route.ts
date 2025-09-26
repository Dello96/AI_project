import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// 카카오 소셜 로그인 시작
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 환경별 리다이렉트 URL 설정
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.NODE_ENV === 'production' 
                     ? 'https://your-app-name.vercel.app' 
                     : 'http://localhost:3000')
    
    const redirectUrl = `${baseUrl}/auth/callback`
    
    console.log('카카오 로그인 리다이렉트 URL:', redirectUrl)
    
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
    
    // 환경별 리다이렉트 URL 설정
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.NODE_ENV === 'production' 
                     ? 'https://your-app-name.vercel.app' 
                     : 'http://localhost:3000')
    
    const redirectUrl = `${baseUrl}/auth/callback`
    
    console.log('카카오 로그인 리다이렉트 URL:', redirectUrl)
    
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
