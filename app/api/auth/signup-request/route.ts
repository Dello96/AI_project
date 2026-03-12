import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase'

// 입력 검증 스키마
const SignupRequestSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '비밀번호는 영문과 숫자를 포함해야 합니다.'),
  name: z.string().min(1, '이름을 입력해주세요.'),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json()
    const parsed = SignupRequestSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: '입력 데이터가 올바르지 않습니다.', 
          details: parsed.error.issues 
        },
        { status: 400 }
      )
    }
    
    const { email, password, name, phone } = parsed.data
    const normalizedPhone = phone?.trim() || null
    
    const supabaseAdmin = createServerSupabaseClient()
    let authUser: { id: string; email_confirmed_at?: string | null } | null = null
    let usedAdminFallback = false

    // Supabase Auth를 사용하여 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone: normalizedPhone
        }
      }
    })
    
    if (authError) {
      console.error('사용자 생성 오류:', authError)
      
      // 이메일 중복 오류 처리
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: '이미 가입된 이메일 주소입니다.' },
          { status: 409 }
        )
      }
      
      // 이메일 형식 오류 처리
      if (authError.code === 'email_address_invalid') {
        return NextResponse.json(
          { error: '유효하지 않은 이메일 주소입니다.' },
          { status: 400 }
        )
      }
      
      // 비밀번호 강도 오류 처리
      if (authError.message.includes('password')) {
        return NextResponse.json(
          { error: '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.' },
          { status: 400 }
        )
      }

      // 이메일 발송 제한 초과 시 관리자 API로 우회 생성 (개발/운영 안정성 보완)
      if (authError.code === 'over_email_send_rate_limit') {
        const { data: fallbackUserData, error: fallbackError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            phone: normalizedPhone
          }
        })

        if (fallbackError) {
          console.error('이메일 제한 우회 생성 오류:', fallbackError)

          if (
            fallbackError.message.includes('already registered') ||
            fallbackError.message.includes('already been registered')
          ) {
            return NextResponse.json(
              { error: '이미 가입된 이메일 주소입니다. 비밀번호 로그인을 시도해주세요.' },
              { status: 409 }
            )
          }

          return NextResponse.json(
            {
              error:
                '인증 이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해주세요.'
            },
            { status: 429 }
          )
        }

        authUser = fallbackUserData.user
        usedAdminFallback = true
      } else {
        return NextResponse.json(
          { error: `가입 요청에 실패했습니다: ${authError.message}` },
          { status: 500 }
        )
      }
    } else {
      authUser = authData.user
    }
    
    if (!authUser) {
      return NextResponse.json(
        { error: '사용자 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // user_profiles에 전화번호 포함 프로필 저장 (service role로 RLS 영향 제거)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(
        {
          id: authUser.id,
          email,
          name,
          phone: normalizedPhone,
          role: 'member',
          is_approved: false
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      console.error('사용자 프로필 저장 오류:', profileError)
      return NextResponse.json(
        { error: '회원 정보 저장 중 오류가 발생했습니다. 관리자에게 문의해주세요.' },
        { status: 500 }
      )
    }

    // 이메일 확인이 필요한 경우
    if (!usedAdminFallback && authUser && !authUser.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        message: `${email}로 인증 메일을 보냈습니다. 메일함(스팸함 포함)에서 인증 링크를 눌러 계정을 활성화해주세요.`,
        requiresEmailConfirmation: true
      })
    }

    // 이메일 확인이 완료된 경우 또는 fallback으로 즉시 생성된 경우
    return NextResponse.json({
      success: true,
      message: usedAdminFallback
        ? '가입 요청이 접수되었습니다.'
        : '가입이 완료되었습니다.',
      requiresEmailConfirmation: false
    })

  } catch (error) {
    console.error('회원가입 요청 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}