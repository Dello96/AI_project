import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 현재 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // 인증이 안 되어 있으면 기본값 반환
    if (authError || !user) {
      return NextResponse.json({ 
        success: true, 
        data: {
          postCount: 0,
          totalLikes: 0,
          eventCount: 0,
          commentCount: 0
        }
      })
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: '사용자 프로필을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 작성한 게시글 수 조회
    const { count: postCount, error: postError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id)

    if (postError) {
      console.error('게시글 수 조회 오류:', postError)
    }

    // 받은 좋아요 수 조회 (내가 작성한 게시글들의 좋아요 합계)
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, like_count')
      .eq('author_id', user.id)

    if (postsError) {
      console.error('게시글 조회 오류:', postsError)
    }

    const totalLikes = posts?.reduce((sum, post) => sum + (post.like_count || 0), 0) || 0

    // 참여한 이벤트 수 조회 (출석 체크한 이벤트 수)
    const { count: eventCount, error: eventError } = await supabase
      .from('event_attendance')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (eventError) {
      console.error('이벤트 참여 수 조회 오류:', eventError)
    }

    // 댓글 수 조회
    const { count: commentCount, error: commentError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id)

    if (commentError) {
      console.error('댓글 수 조회 오류:', commentError)
    }

    const stats = {
      postCount: postCount || 0,
      totalLikes,
      eventCount: eventCount || 0,
      commentCount: commentCount || 0
    }

    return NextResponse.json({ 
      success: true, 
      data: stats 
    })

  } catch (error) {
    console.error('사용자 통계 조회 오류:', error)
    return NextResponse.json(
      { error: '사용자 통계를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
