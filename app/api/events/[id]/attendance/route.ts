import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase'

// 참석 상태 업데이트 스키마
const UpdateAttendanceSchema = z.object({
  status: z.enum(['attending', 'not_attending', 'maybe']),
  userId: z.string().optional()
})

// 참석 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params
    const serverSupabase = createServerSupabaseClient()

    // 이벤트 참석자 목록 조회
    const { data: attendances, error } = await serverSupabase
      .from('event_attendance')
      .select(`
        id,
        user_id,
        status,
        created_at,
        user:user_id(id, name, email)
      `)
      .eq('event_id', eventId)

    if (error) {
      console.error('참석자 조회 오류:', error)
      return NextResponse.json(
        { error: '참석자 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 참석자 수 계산
    const attendingCount = attendances?.filter(a => a.status === 'attending').length || 0
    const maybeCount = attendances?.filter(a => a.status === 'maybe').length || 0
    const notAttendingCount = attendances?.filter(a => a.status === 'not_attending').length || 0

    return NextResponse.json({
      success: true,
      data: {
        attendances: attendances || [],
        counts: {
          attending: attendingCount,
          maybe: maybeCount,
          notAttending: notAttendingCount,
          total: attendances?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('참석자 조회 중 예외 발생:', error)
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 참석 상태 업데이트
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params
    const body = await request.json()
    
    const parsed = UpdateAttendanceSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: '잘못된 요청 데이터입니다.', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { status, userId } = parsed.data
    const serverSupabase = createServerSupabaseClient()

    // 익명 사용자 ID (기본값)
    const anonymousUserId = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) 
      ? userId 
      : '00000000-0000-0000-0000-000000000000'

    // 기존 참석 기록 확인
    const { data: existingAttendance } = await serverSupabase
      .from('event_attendance')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', anonymousUserId)
      .single()

    let result
    if (existingAttendance) {
      // 기존 기록 업데이트
      const { data, error } = await serverSupabase
        .from('event_attendance')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', existingAttendance.id)
        .select()
        .single()

      if (error) {
        console.error('참석 상태 업데이트 오류:', error)
        return NextResponse.json(
          { error: '참석 상태 업데이트에 실패했습니다.' },
          { status: 500 }
        )
      }
      result = data
    } else {
      // 새 참석 기록 생성
      const { data, error } = await serverSupabase
        .from('event_attendance')
        .insert({
          event_id: eventId,
          user_id: anonymousUserId,
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('참석 상태 생성 오류:', error)
        return NextResponse.json(
          { error: '참석 상태 생성에 실패했습니다.' },
          { status: 500 }
        )
      }
      result = data
    }

    // 이벤트의 참석자 수 업데이트
    const { data: attendances } = await serverSupabase
      .from('event_attendance')
      .select('status')
      .eq('event_id', eventId)
      .eq('status', 'attending')

    const attendingCount = attendances?.length || 0

    await serverSupabase
      .from('events')
      .update({ attendee_count: attendingCount })
      .eq('id', eventId)

    return NextResponse.json({
      success: true,
      message: '참석 상태가 업데이트되었습니다.',
      data: result
    })

  } catch (error) {
    console.error('참석 상태 업데이트 중 예외 발생:', error)
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
