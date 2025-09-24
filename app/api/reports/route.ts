import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sanitizeComment } from '@/lib/sanitize'
import { ReportCreateSchema } from '@/lib/report-schemas'

// 레이트 리밋을 위한 메모리 저장소 (실제 운영에서는 Redis 사용 권장)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// 레이트 리밋 확인 (분당 5회 제한)
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 }) // 1분 후 리셋
    return true
  }
  
  if (userLimit.count >= 5) {
    return false
  }
  
  userLimit.count++
  return true
}

// 신고 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const { targetType, targetId, reason, description } = ReportCreateSchema.parse(body)

    // 레이트 리밋 확인
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: '신고는 분당 5회까지만 가능합니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // 중복 신고 확인
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .single()

    if (existingReport) {
      return NextResponse.json(
        { error: '이미 신고한 콘텐츠입니다.' },
        { status: 409 }
      )
    }

    // 대상 존재 확인
    let targetExists = false
    if (targetType === 'post') {
      const { data: post } = await supabase
        .from('posts')
        .select('id')
        .eq('id', targetId)
        .single()
      targetExists = !!post
    } else if (targetType === 'comment') {
      const { data: comment } = await supabase
        .from('comments')
        .select('id')
        .eq('id', targetId)
        .single()
      targetExists = !!comment
    }

    if (!targetExists) {
      return NextResponse.json(
        { error: '신고할 콘텐츠를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 신고 생성
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description ? sanitizeComment(description) : null,
        status: 'pending'
      })
      .select(`
        *,
        reporter:reporter_id(id, name, email)
      `)
      .single()

    if (reportError) {
      console.error('신고 생성 오류:', reportError)
      return NextResponse.json(
        { error: '신고 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 관리자에게 알림 (간단한 로그, 실제로는 알림 시스템 연동)
    console.log(`새 신고가 접수되었습니다: ${report.id} - ${targetType}:${targetId}`)

    return NextResponse.json({
      success: true,
      message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
      data: report
    }, { status: 201 })

  } catch (error) {
    console.error('신고 생성 오류:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자의 신고 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 사용자의 신고 목록 조회
    const { data: reports, error, count } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:reporter_id(id, name, email)
      `, { count: 'exact' })
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('신고 목록 조회 오류:', error)
      return NextResponse.json(
        { error: '신고 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

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
    console.error('신고 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
