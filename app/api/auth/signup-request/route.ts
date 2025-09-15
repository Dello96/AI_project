import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

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
    
    // Supabase Auth를 사용하여 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone: phone || null
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
      
      return NextResponse.json(
        { error: `가입 요청에 실패했습니다: ${authError.message}` },
        { status: 500 }
      )
    }
    
    if (!authData.user) {
      return NextResponse.json(
        { error: '사용자 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자 메타데이터 업데이트 (선택적)
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        name,
        phone: phone || null
      }
    })

    if (updateError) {
      console.error('사용자 메타데이터 업데이트 오류:', updateError)
      // 메타데이터 업데이트 실패해도 회원가입은 성공으로 처리
    }

    // 이메일 확인이 필요한 경우
    if (authData.user && !authData.user.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        message: '가입 요청이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.',
        requiresEmailConfirmation: true
      })
    }

    // 이메일 확인이 완료된 경우
    return NextResponse.json({
      success: true,
      message: '가입이 완료되었습니다. 로그인해주세요.',
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