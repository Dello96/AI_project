import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

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

    // 서버 사이드 Supabase 클라이언트 생성
    const supabase = createServerSupabaseClient()

    // 이벤트 삭제
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('이벤트 삭제 오류:', error)
      return NextResponse.json(
        { 
          error: '이벤트 삭제에 실패했습니다.', 
          details: error.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '이벤트가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('이벤트 삭제 중 예외 발생:', error)
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
