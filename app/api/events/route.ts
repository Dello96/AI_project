import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// 이벤트 생성 스키마
const CreateEventSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(100, '제목은 100자 이하로 입력해주세요.'),
  description: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  startDate: z.string().min(1, '시작 날짜를 입력해주세요.'),
  endDate: z.string().min(1, '종료 날짜를 입력해주세요.'),
  location: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  locationData: z.object({
    name: z.string(),
    address: z.string(),
    lat: z.number(),
    lng: z.number()
  }).optional(),
  category: z.enum(['worship', 'meeting', 'event', 'smallgroup', 'vehicle'], { 
    message: '올바른 카테고리를 선택해주세요.' 
  }),
  isAllDay: z.boolean().default(false),
  authorId: z.string().optional()
})

// 이벤트 조회 스키마
const GetEventsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50)
})

export async function POST(request: NextRequest) {
  try {
    
    // 요청 본문 파싱
    const body = await request.json()
    
    Object.keys(body).forEach(key => {
    })
    
    const parsed = CreateEventSchema.safeParse(body)
    
    if (!parsed.success) {
      console.error('=== 유효성 검사 실패 ===')
      console.error('Zod 오류 상세:')
      parsed.error.issues.forEach((issue, index) => {
        console.error(`${index + 1}. 경로: ${issue.path.join('.')}`)
        console.error(`   코드: ${issue.code}`)
        console.error(`   메시지: ${issue.message}`)
        console.error(`   받은 값: ${JSON.stringify(issue.input)}`)
        console.error(`   받은 값 타입: ${typeof issue.input}`)
      })
      
      // 카테고리 특별 검증
      if (body.category) {
        console.error('카테고리 검증 실패:')
        console.error(`받은 카테고리: "${body.category}" (타입: ${typeof body.category})`)
        console.error(`유효한 카테고리: ['worship', 'meeting', 'event', 'smallgroup', 'vehicle']`)
        console.error(`카테고리 포함 여부: ${['worship', 'meeting', 'event', 'smallgroup', 'vehicle'].includes(body.category)}`)
      }
      
      return NextResponse.json(
        { 
          error: '잘못된 요청 데이터입니다.', 
          details: parsed.error.issues,
          receivedData: body
        },
        { status: 400 }
      )
    }
    
    
    const { title, description, startDate, endDate, location, locationData, category, isAllDay, authorId } = parsed.data
    
    // Authorization 헤더에서 토큰 확인
    const authHeader = request.headers.get('Authorization')
    
    let user = null
    let authError = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Authorization 헤더에서 토큰 사용
      const token = authHeader.substring(7)
      
      const supabase = createServerSupabaseClient()
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token)
      user = tokenUser
      authError = tokenError
    } else {
      // 쿠키에서 세션 확인
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()
      user = sessionUser
      authError = sessionError
    }
    
    if (authError || !user) {
      console.error('인증 오류:', authError)
      return NextResponse.json(
        { error: '인증이 필요합니다.', details: authError?.message },
        { status: 401 }
      )
    }
    
    
    // 사용자 프로필 확인 및 생성
    let actualAuthorId = user.id
    
    // Service Role 클라이언트 사용 (프로필 생성/조회용)
    const serverSupabase = createServerSupabaseClient()
    
    // user_profiles 테이블에서 사용자 프로필 확인
    const { data: existingProfile, error: profileError } = await serverSupabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()
    
    if (profileError && profileError.code === 'PGRST116') {
      // 프로필이 없는 경우 생성
      
      const { error: createProfileError } = await serverSupabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || 
                user.user_metadata?.full_name || 
                user.user_metadata?.nickname || 
                '사용자',
          phone: user.user_metadata?.phone || null,
          role: 'member',
          is_approved: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (createProfileError) {
        console.error('사용자 프로필 생성 오류:', createProfileError)
        return NextResponse.json(
          { error: '사용자 프로필 생성에 실패했습니다.' },
          { status: 500 }
        )
      }
    } else if (profileError) {
      console.error('사용자 프로필 조회 오류:', profileError)
      return NextResponse.json(
        { error: '사용자 프로필을 확인할 수 없습니다.' },
        { status: 500 }
      )
    }
    
    // 이벤트 생성
    // 데이터베이스 삽입을 위한 데이터 준비
    const insertData = {
      title: title.trim(),
      description: description && description.trim() !== '' ? description.trim() : null,
      start_date: startDate,
      end_date: endDate,
      all_day: Boolean(isAllDay),
      location: location && location.trim() !== '' ? location.trim() : null,
      location_data: locationData || null,
      category,
      created_by: actualAuthorId
    }
    
    
    const { data: event, error } = await serverSupabase
      .from('events')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      console.error('이벤트 생성 오류:', error)
      return NextResponse.json(
        { error: '이벤트 생성에 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }
    
    // 응답 데이터 가공
    const formattedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      isAllDay: event.all_day,
      location: event.location,
      category: event.category,
      authorId: event.created_by,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }
    
    return NextResponse.json({
      success: true,
      message: '이벤트가 성공적으로 생성되었습니다.',
      event: formattedEvent
    })
    
  } catch (error) {
    console.error('이벤트 생성 서버 오류:', error)
    
    // 에러 타입에 따른 상세 메시지 제공
    let errorMessage = '서버 내부 오류가 발생했습니다.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const parsed = GetEventsSchema.safeParse(Object.fromEntries(searchParams))
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: '잘못된 요청 파라미터입니다.', details: parsed.error.issues },
        { status: 400 }
      )
    }
    
    const { startDate, endDate, category, limit } = parsed.data
    
    // 서버 사이드 Supabase 클라이언트 사용
    const serverSupabase = createServerSupabaseClient()
    
    let query = serverSupabase
      .from('events')
      .select(`
        *,
        user_profiles (
          id,
          name,
          email
        )
      `, { count: 'exact' })
      .order('start_date', { ascending: true })
      .limit(limit)
    
    // 날짜 필터
    if (startDate) {
      query = query.gte('start_date', startDate)
    }
    if (endDate) {
      query = query.lte('end_date', endDate)
    }
    
    // 카테고리 필터
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data: events, error, count } = await query
    
    if (error) {
      console.error('이벤트 조회 오류:', error)
      return NextResponse.json(
        { error: '이벤트 목록을 불러오는데 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }
    
    // 응답 데이터 가공
    const formattedEvents = (events || []).map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      isAllDay: event.all_day,
      location: event.location,
      category: event.category,
      authorId: event.created_by,
      author: event.user_profiles ? {
        id: event.user_profiles.id,
        name: event.user_profiles.name,
        email: event.user_profiles.email
      } : null,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        events: formattedEvents,
        totalCount: count || 0
      }
    })
    
  } catch (error) {
    console.error('이벤트 조회 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
