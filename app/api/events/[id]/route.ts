import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// 이벤트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: '이벤트 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 클라이언트 세션을 사용하는 Supabase 클라이언트
    const supabase = createRouteHandlerClient({ cookies })

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('인증 오류:', authError)
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 이벤트 존재 및 작성자 확인
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('id, created_by')
      .eq('id', id)
      .single()

    if (fetchError || !event) {
      return NextResponse.json(
        { error: '이벤트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 작성자 권한 확인
    if (event.created_by !== user.id) {
      return NextResponse.json(
        { error: '이벤트 삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 이벤트 삭제
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('이벤트 삭제 오류:', deleteError)
      return NextResponse.json(
        { error: '이벤트 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '이벤트가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('이벤트 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}