import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { requireAuth, isAdmin } from '@/lib/post-auth'

// 교회 도메인 생성 스키마
const CreateChurchDomainSchema = z.object({
  domain: z.string().min(2, '도메인은 2자 이상이어야 합니다.').max(50, '도메인은 50자 이하여야 합니다.'),
  name: z.string().min(2, '교회명은 2자 이상이어야 합니다.').max(100, '교회명은 100자 이하여야 합니다.'),
  description: z.string().optional()
})

// GET /api/admin/church-domains - 교회 도메인 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const user = await requireAuth(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { data: domains, error } = await supabase
      .from('church_domains')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('교회 도메인 조회 오류:', error)
      return NextResponse.json(
        { error: '교회 도메인 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: domains || []
    })

  } catch (error) {
    console.error('교회 도메인 조회 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/admin/church-domains - 교회 도메인 생성
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const user = await requireAuth(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 요청 본문 파싱
    const body = await request.json()
    const parsed = CreateChurchDomainSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { domain, name, description } = parsed.data

    // 중복 도메인 확인
    const { data: existingDomain, error: checkError } = await supabase
      .from('church_domains')
      .select('id')
      .eq('domain', domain)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('도메인 중복 확인 오류:', checkError)
      return NextResponse.json(
        { error: '도메인 중복 확인에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (existingDomain) {
      return NextResponse.json(
        { error: '이미 존재하는 도메인입니다.' },
        { status: 409 }
      )
    }

    // 교회 도메인 생성
    const { data: newDomain, error: createError } = await supabase
      .from('church_domains')
      .insert({
        domain,
        name,
        description,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('교회 도메인 생성 오류:', createError)
      return NextResponse.json(
        { error: '교회 도메인 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '교회 도메인이 성공적으로 생성되었습니다.',
      data: newDomain
    })

  } catch (error) {
    console.error('교회 도메인 생성 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
