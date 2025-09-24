import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyJWT } from '@/lib/auth-tokens'
import { supabase } from '@/lib/supabase'

// 신고 상태 변경 스키마
const UpdateReportSchema = z.object({
  reportId: z.string().uuid('유효한 신고 ID가 아닙니다.'),
  status: z.enum(['pending', 'under_review', 'resolved', 'dismissed']),
  adminNotes: z.string().optional(),
  assignedAdminId: z.string().uuid().optional()
})

export async function GET(request: NextRequest) {
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
    
    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'all'
    const reason = searchParams.get('reason') || 'all'
    
    // 페이지네이션 계산
    const offset = (page - 1) * limit
    
    // 쿼리 빌더
    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:reporter_id(email, name),
        assigned_admin:assigned_admin_id(email, name)
      `, { count: 'exact' })
    
    // 상태별 필터링
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    // 사유별 필터링
    if (reason !== 'all') {
      query = query.eq('reason', reason)
    }
    
    // 정렬 및 페이지네이션
    const { data: reports, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('신고 목록 조회 오류:', error)
      return NextResponse.json(
        { error: '신고 목록을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
    
    // 총 페이지 수 계산
    const totalPages = Math.ceil((count || 0) / limit)
    
    return NextResponse.json({
      success: true,
      data: {
        reports: reports || [],
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: count || 0,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })
    
  } catch (error) {
    console.error('신고 목록 API 오류:', error)
    
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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
    const parsed = UpdateReportSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: parsed.error.issues },
        { status: 400 }
      )
    }
    
    const { reportId, status, adminNotes, assignedAdminId } = parsed.data
    
    // 신고 조회
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()
    
    if (reportError || !report) {
      return NextResponse.json(
        { error: '신고를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    // 신고 상태 업데이트
    const updateData: any = {
      status,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    }
    
    if (assignedAdminId) {
      updateData.assigned_admin_id = assignedAdminId
    }
    
    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_at = new Date().toISOString()
    }
    
    const { error: updateError } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
    
    if (updateError) {
      console.error('신고 상태 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: '신고 상태 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
    
    // 관리자 감사 로그 기록
    const { error: auditError } = await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: payload.sub,
        action: 'report_review',
        target_type: 'report',
        target_id: reportId,
        details: {
          previousStatus: report.status,
          newStatus: status,
          adminNotes,
          assignedAdminId
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent')
      })
    
    if (auditError) {
      console.error('감사 로그 기록 오류:', auditError)
      // 감사 로그 실패해도 업데이트는 성공으로 처리
    }
    
    return NextResponse.json({
      success: true,
      message: '신고 상태가 성공적으로 업데이트되었습니다.',
      report: {
        id: reportId,
        status,
        adminNotes,
        assignedAdminId,
        updatedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('신고 상태 업데이트 API 오류:', error)
    
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
