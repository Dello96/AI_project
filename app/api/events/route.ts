import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase'

// 이벤트 생성 스키마
const CreateEventSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(100, '제목은 100자 이하로 입력해주세요.'),
  description: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  startDate: z.string().min(1, '시작 날짜를 입력해주세요.'),
  endDate: z.string().min(1, '종료 날짜를 입력해주세요.'),
  location: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  category: z.enum(['worship', 'meeting', 'event', 'smallgroup'], { 
    message: '올바른 카테고리를 선택해주세요.' 
  }),
  isAllDay: z.boolean().optional().default(false),
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
    console.log('=== 이벤트 생성 API 호출 시작 ===')
    
    // 요청 본문 파싱
    const body = await request.json()
    console.log('받은 요청 데이터:')
    console.log(JSON.stringify(body, null, 2))
    
    console.log('각 필드별 타입 확인:')
    Object.keys(body).forEach(key => {
      console.log(`${key}: ${typeof body[key]} = ${JSON.stringify(body[key])}`)
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
      })
      
      return NextResponse.json(
        { 
          error: '잘못된 요청 데이터입니다.', 
          details: parsed.error.issues,
          receivedData: body
        },
        { status: 400 }
      )
    }
    
    console.log('유효성 검사 통과! 파싱된 데이터:', parsed.data)
    
    const { title, description, startDate, endDate, location, category, isAllDay, authorId } = parsed.data
    
    // 서버 사이드 Supabase 클라이언트 사용
    const serverSupabase = createServerSupabaseClient()
    
    // 익명 사용자 ID (기본값) - UUID 형식 검증
    const anonymousUserId = authorId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authorId) 
      ? authorId 
      : '00000000-0000-0000-0000-000000000000'
    
    // 이벤트 생성
    // 데이터베이스 삽입을 위한 데이터 준비
    const insertData = {
      title: title.trim(),
      description: description && description.trim() !== '' ? description.trim() : null,
      start_date: startDate,
      end_date: endDate,
      all_day: Boolean(isAllDay),
      location: location && location.trim() !== '' ? location.trim() : null,
      category,
      created_by: anonymousUserId
    }
    
    console.log('데이터베이스에 삽입할 데이터:', insertData)
    
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
      .select('*', { count: 'exact' })
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
