import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 참석/취소 토글
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 이벤트 정보 조회
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: '이벤트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 현재 참석자 목록 조회
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (attendanceError && attendanceError.code !== 'PGRST116') {
      console.error('참석 정보 조회 오류:', attendanceError)
      return NextResponse.json(
        { error: '참석 정보를 조회할 수 없습니다.' },
        { status: 500 }
      )
    }

    const isCurrentlyAttending = !!attendance

    if (isCurrentlyAttending) {
      // 참석 취소
      const { error: deleteError } = await supabase
        .from('event_attendance')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId)

      if (deleteError) {
        console.error('참석 취소 오류:', deleteError)
        return NextResponse.json(
          { error: '참석 취소에 실패했습니다.' },
          { status: 500 }
        )
      }

      // 수동으로 참석자 수 감소 (트리거 대신)
      const { error: updateError } = await supabase
        .from('events')
        .update({ 
          current_attendees: Math.max(0, (event.current_attendees || 0) - 1)
        })
        .eq('id', eventId)

      if (updateError) {
        console.error('참석자 수 업데이트 오류:', updateError)
      }

      // 업데이트된 참석자 수 조회
      const { data: updatedEvent } = await supabase
        .from('events')
        .select('current_attendees')
        .eq('id', eventId)
        .single()

      return NextResponse.json({
        success: true,
        attending: false,
        currentAttendees: updatedEvent?.current_attendees || 0,
        message: '참석이 취소되었습니다.'
      })
    } else {
      // 참석 등록
      // 최대 참석 인원 확인
      if (event.max_attendees && event.current_attendees >= event.max_attendees) {
        return NextResponse.json(
          { error: '참석 인원이 가득 찼습니다.' },
          { status: 400 }
        )
      }

      // 중복 참석 방지를 위한 추가 확인
      const { data: existingAttendance, error: checkError } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('중복 참석 확인 오류:', checkError)
        return NextResponse.json(
          { error: '참석 상태를 확인할 수 없습니다.' },
          { status: 500 }
        )
      }

      if (existingAttendance) {
        return NextResponse.json(
          { error: '이미 참석 등록되어 있습니다.' },
          { status: 400 }
        )
      }

      const { error: insertError } = await supabase
        .from('event_attendance')
        .insert({
          event_id: eventId,
          user_id: userId
        })

      if (insertError) {
        console.error('참석 등록 오류:', insertError)
        return NextResponse.json(
          { error: '참석 등록에 실패했습니다.' },
          { status: 500 }
        )
      }

      // 수동으로 참석자 수 증가 (트리거 대신)
      const { error: updateError } = await supabase
        .from('events')
        .update({ 
          current_attendees: (event.current_attendees || 0) + 1
        })
        .eq('id', eventId)

      if (updateError) {
        console.error('참석자 수 업데이트 오류:', updateError)
      }

      // 업데이트된 참석자 수 조회
      const { data: updatedEvent } = await supabase
        .from('events')
        .select('current_attendees')
        .eq('id', eventId)
        .single()

      return NextResponse.json({
        success: true,
        attending: true,
        currentAttendees: updatedEvent?.current_attendees || 0,
        message: '참석이 등록되었습니다.'
      })
    }
  } catch (error) {
    console.error('참석 처리 오류:', error)
    return NextResponse.json(
      { error: '참석 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 참석 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자의 참석 상태 조회
    const { data: attendance, error } = await supabase
      .from('event_attendance')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('참석 상태 조회 오류:', error)
      return NextResponse.json(
        { error: '참석 상태를 조회할 수 없습니다.' },
        { status: 500 }
      )
    }

    // 이벤트의 현재 참석자 수 조회
    const { data: event } = await supabase
      .from('events')
      .select('current_attendees')
      .eq('id', eventId)
      .single()

    return NextResponse.json({
      success: true,
      attending: !!attendance,
      currentAttendees: event?.current_attendees || 0
    })
  } catch (error) {
    console.error('참석 상태 조회 오류:', error)
    return NextResponse.json(
      { error: '참석 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}