import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { id: postId } = params

    // 조회수 증가
    const { error } = await supabase.rpc('increment_post_view_count', {
      post_id: postId
    })

    if (error) {
      console.error('조회수 증가 오류:', error)
      return NextResponse.json(
        { error: '조회수 증가에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '조회수가 증가되었습니다.'
    })

  } catch (error) {
    console.error('조회수 증가 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
