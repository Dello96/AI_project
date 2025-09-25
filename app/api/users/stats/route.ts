import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// 사용자 통계 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // URL 파라미터에서 사용자 ID 가져오기
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자의 게시글 수 조회
    const { count: postCount, error: postError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId)
      .eq('is_anonymous', false)

    if (postError) {
      console.error('게시글 수 조회 오류:', postError)
      return NextResponse.json(
        { error: '게시글 수 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자의 댓글 수 조회
    const { count: commentCount, error: commentError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId)
      .eq('is_anonymous', false)

    if (commentError) {
      console.error('댓글 수 조회 오류:', commentError)
      return NextResponse.json(
        { error: '댓글 수 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자가 받은 좋아요 수 조회 (게시글 + 댓글)
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('like_count')
      .eq('author_id', userId)
      .eq('is_anonymous', false)

    if (postsError) {
      console.error('게시글 좋아요 수 조회 오류:', postsError)
      return NextResponse.json(
        { error: '게시글 좋아요 수 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('like_count')
      .eq('author_id', userId)
      .eq('is_anonymous', false)

    if (commentsError) {
      console.error('댓글 좋아요 수 조회 오류:', commentsError)
      return NextResponse.json(
        { error: '댓글 좋아요 수 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 총 좋아요 수 계산
    const totalLikes = (posts || []).reduce((sum, post) => sum + (post.like_count || 0), 0) +
                      (comments || []).reduce((sum, comment) => sum + (comment.like_count || 0), 0)

    return NextResponse.json({
      success: true,
      data: {
        postCount: postCount || 0,
        commentCount: commentCount || 0,
        totalLikes: totalLikes
      }
    })
  } catch (error) {
    console.error('사용자 통계 조회 오류:', error)
    return NextResponse.json(
      { error: '사용자 통계 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자 통계 업데이트 (게시글 작성 후 호출)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const body = await request.json()
    const { userId, type } = body // type: 'post' | 'comment' | 'like'
    
    if (!userId || !type) {
      return NextResponse.json(
        { error: '사용자 ID와 타입이 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자 프로필의 통계 필드 업데이트
    let updateData: any = {}
    
    if (type === 'post') {
      // 게시글 수 증가
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('post_count')
        .eq('id', userId)
        .single()
      
      updateData.post_count = (currentProfile?.post_count || 0) + 1
    } else if (type === 'comment') {
      // 댓글 수 증가
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('comment_count')
        .eq('id', userId)
        .single()
      
      updateData.comment_count = (currentProfile?.comment_count || 0) + 1
    } else if (type === 'like') {
      // 좋아요 수 증가
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('like_count')
        .eq('id', userId)
        .single()
      
      updateData.like_count = (currentProfile?.like_count || 0) + 1
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      console.error('사용자 통계 업데이트 오류:', error)
      return NextResponse.json(
        { error: '사용자 통계 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '사용자 통계가 업데이트되었습니다.'
    })
  } catch (error) {
    console.error('사용자 통계 업데이트 오류:', error)
    return NextResponse.json(
      { error: '사용자 통계 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}