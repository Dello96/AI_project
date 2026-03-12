import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 }) }
  }

  const token = authHeader.split(' ')[1]
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return { error: NextResponse.json({ error: '유효하지 않은 인증 정보입니다.' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 }) }
  }

  return { supabase }
}

export async function GET(request: NextRequest) {
  const adminContext = await requireAdmin(request)
  if ('error' in adminContext) return adminContext.error

  const { supabase } = adminContext
  const { data, error } = await supabase
    .from('church_domains')
    .select('*')
    .order('created_at', { ascending: false })

  // 현재 스키마에서 church_domains가 제거된 경우 404 대신 빈 목록 반환
  if (error?.code === '42P01') {
    return NextResponse.json({
      success: true,
      data: [],
      message: 'church_domains 테이블이 없어 빈 목록을 반환합니다.'
    })
  }

  if (error) {
    return NextResponse.json({ error: '교회 도메인 목록을 조회할 수 없습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data || [] })
}

export async function POST(request: NextRequest) {
  const adminContext = await requireAdmin(request)
  if ('error' in adminContext) return adminContext.error

  const { supabase } = adminContext
  const body = await request.json()
  const domain = String(body.domain || '').trim()
  const name = String(body.name || '').trim()
  const description = body.description ? String(body.description).trim() : null

  if (!domain || !name) {
    return NextResponse.json({ error: '도메인과 교회명을 입력해주세요.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('church_domains')
    .insert({
      domain,
      name,
      description,
      is_active: true
    })
    .select()
    .single()

  if (error?.code === '42P01') {
    return NextResponse.json(
      { error: '현재 DB 스키마에는 church_domains 기능이 비활성화되어 있습니다.' },
      { status: 400 }
    )
  }

  if (error) {
    return NextResponse.json({ error: '교회 도메인 추가에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
