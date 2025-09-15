import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

// 좋아요 토글 요청 스키마
const ToggleLikeSchema = z.object({
  targetType: z.enum(['post', 'comment'], {
    message: 'targetType은 post 또는 comment여야 합니다.'
  }),
  targetId: z.string().uuid('유효한 ID가 아닙니다.')
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const parsed = ToggleLikeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { targetType, targetId } = parsed.data

    // 대상 존재 여부 확인
    if (targetType === 'post') {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('id')
        .eq('id', targetId)
        .is('deleted_at', null)
        .single()

      if (postError || !post) {
        return NextResponse.json(
          { error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
    } else if (targetType === 'comment') {
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', targetId)
        .is('deleted_at', null)
        .single()

      if (commentError || !comment) {
        return NextResponse.json(
          { error: '댓글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
    }

    // 기존 좋아요 확인
    const { data: existingLike, error: likeError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq(targetType === 'post' ? 'post_id' : 'comment_id', targetId)
      .single()

    if (likeError && likeError.code !== 'PGRST116') {
      console.error('좋아요 조회 오류:', likeError)
      return NextResponse.json(
        { error: '좋아요 상태를 확인할 수 없습니다.' },
        { status: 500 }
      )
    }

    let liked = false
    let count = 0

    if (existingLike) {
      // 좋아요 제거
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('좋아요 삭제 오류:', deleteError)
        return NextResponse.json(
          { error: '좋아요 취소에 실패했습니다.' },
          { status: 500 }
        )
      }

      liked = false
    } else {
      // 좋아요 추가
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          [targetType === 'post' ? 'post_id' : 'comment_id']: targetId
        })

      if (insertError) {
        console.error('좋아요 추가 오류:', insertError)
        return NextResponse.json(
          { error: '좋아요 추가에 실패했습니다.' },
          { status: 500 }
        )
      }

      liked = true
    }

    // 현재 좋아요 수 조회
    const { count: likeCount, error: countError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq(targetType === 'post' ? 'post_id' : 'comment_id', targetId)

    if (countError) {
      console.error('좋아요 수 조회 오류:', countError)
      return NextResponse.json(
        { error: '좋아요 수를 조회할 수 없습니다.' },
        { status: 500 }
      )
    }

    count = likeCount || 0

    return NextResponse.json({
      success: true,
      data: {
        liked,
        count
      }
    })

  } catch (error) {
    console.error('좋아요 토글 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
