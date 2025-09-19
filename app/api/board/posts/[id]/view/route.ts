import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🎯 조회수 증가 API 호출:', params.id, '시간:', new Date().toISOString())
    
    const supabase = createServerSupabaseClient()
    const { id: postId } = params

    // 게시글 존재 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, view_count')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      console.error('게시글 조회 오류:', postError)
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log('현재 조회수:', post.view_count)

    // 조회수 증가
    const { error } = await supabase.rpc('increment_post_view_count', {
      post_id: postId
    })

    if (error) {
      console.error('조회수 증가 RPC 오류:', error)
      
      // RPC 함수가 없는 경우 직접 업데이트
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          view_count: (post.view_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (updateError) {
        console.error('조회수 직접 업데이트 오류:', updateError)
        return NextResponse.json(
          { error: '조회수 증가에 실패했습니다.', details: updateError.message },
          { status: 500 }
        )
      }
    }

    console.log('조회수 증가 성공')
    return NextResponse.json({
      success: true,
      message: '조회수가 증가되었습니다.',
      viewCount: (post.view_count || 0) + 1
    })

  } catch (error) {
    console.error('조회수 증가 서버 오류:', error)
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
