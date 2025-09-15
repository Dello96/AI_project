import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

// 좋아요 상태 조회 요청 스키마
const GetLikeStatusSchema = z.object({
  targetType: z.enum(['post', 'comment'], {
    message: 'targetType은 post 또는 comment여야 합니다.'
  }),
  targetId: z.string().uuid('유효한 ID가 아닙니다.')
})

export async function GET(request: NextRequest) {
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

    // 쿼리 파라미터 파싱 및 검증
    const { searchParams } = new URL(request.url)
    const parsed = GetLikeStatusSchema.safeParse({
      targetType: searchParams.get('targetType'),
      targetId: searchParams.get('targetId')
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { targetType, targetId } = parsed.data

    // 사용자의 좋아요 상태 확인
    const { data: like, error: likeError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq(targetType === 'post' ? 'post_id' : 'comment_id', targetId)
      .single()

    if (likeError && likeError.code !== 'PGRST116') {
      console.error('좋아요 상태 조회 오류:', likeError)
      return NextResponse.json(
        { error: '좋아요 상태를 확인할 수 없습니다.' },
        { status: 500 }
      )
    }

    // 전체 좋아요 수 조회
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

    return NextResponse.json({
      success: true,
      data: {
        liked: !!like,
        count: likeCount || 0
      }
    })

  } catch (error) {
    console.error('좋아요 상태 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
