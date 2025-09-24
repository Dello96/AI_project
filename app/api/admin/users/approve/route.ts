import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { verifyJWT } from '@/lib/auth-tokens'
import { emailService } from '@/lib/emailService'

// 입력 검증 스키마
const ApproveUserSchema = z.object({
  userId: z.string().uuid('유효한 사용자 ID가 아닙니다.'),
  adminNotes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    const payload = verifyJWT(token)
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }
    
    // 요청 본문 파싱
    const body = await request.json()
    const parsed = ApproveUserSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: parsed.error.issues },
        { status: 400 }
      )
    }
    
    const { userId, adminNotes } = parsed.data
    
    // 임시 회원가입 요청 조회
    const { data: pendingMember, error: pendingError } = await supabase
      .from('pending_members')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (pendingError || !pendingMember) {
      return NextResponse.json(
        { error: '가입 요청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    if (pendingMember.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 가입 요청입니다.' },
        { status: 400 }
      )
    }
    
    // Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: pendingMember.email,
      password: pendingMember.hashed_password,
      email_confirm: true,
      user_metadata: {
        name: pendingMember.name,
        phone: pendingMember.phone
      }
    })
    
    if (authError || !authData.user) {
      console.error('Supabase Auth 사용자 생성 오류:', authError)
      return NextResponse.json(
        { error: '사용자 계정 생성에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    // 사용자 프로필 생성
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: pendingMember.email,
        name: pendingMember.name,
        phone: pendingMember.phone,
        church_domain_id: pendingMember.church_domain_id,
        role: 'user',
        is_approved: true,
        approved_at: new Date().toISOString(),
        approved_by: payload.sub
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('사용자 프로필 생성 오류:', profileError)
      // Auth 사용자 삭제
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: '사용자 프로필 생성에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    // 임시 회원가입 요청 상태 업데이트
    const { error: updateError } = await supabase
      .from('pending_members')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: payload.sub
      })
      .eq('id', userId)
    
    if (updateError) {
      console.error('사용자 승인 오류:', updateError)
      return NextResponse.json(
        { error: '사용자 승인 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
    
    // 관리자 감사 로그 기록
    const { error: auditError } = await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: payload.sub,
        action: 'user_approve',
        target_type: 'user',
        target_id: userId,
        details: {
          adminNotes,
          previousStatus: 'pending',
          newStatus: 'approved'
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent')
      })
    
    if (auditError) {
      console.error('감사 로그 기록 오류:', auditError)
      // 감사 로그 실패해도 승인은 성공으로 처리
    }
    
    // 승인 알림 이메일 발송
    try {
      const churchName = pendingMember.church_domains?.name || '교회'
      await emailService.sendApprovalEmail(
        pendingMember.email,
        pendingMember.name,
        churchName
      )
    } catch (emailError) {
      console.error('승인 알림 이메일 발송 오류:', emailError)
      // 이메일 발송 실패해도 승인은 성공으로 처리
    }
    
    return NextResponse.json(
      { 
        success: true,
        message: '사용자가 성공적으로 승인되었습니다.',
        user: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role,
          isApproved: true,
          approvedAt: new Date().toISOString()
        }
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('사용자 승인 API 오류:', error)
    
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
