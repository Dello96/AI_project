import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 좋아요 수가 가장 많은 상위 5개 게시글 조회
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        category,
        is_anonymous,
        view_count,
        like_count,
        comment_count,
        created_at,
        user_profiles (
          id,
          name,
          email
        )
      `)
      .order('like_count', { ascending: false })
      .limit(5)

    if (error) {
      console.error('인기 게시글 조회 오류:', error)
      return NextResponse.json(
        { error: '인기 게시글을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 응답 데이터 가공
    const formattedPosts = (posts || []).map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      isAnonymous: post.is_anonymous,
      viewCount: post.view_count || 0,
      likeCount: post.like_count || 0,
      commentCount: post.comment_count || 0,
      author: post.is_anonymous ? null : post.user_profiles,
      createdAt: post.created_at
    }))

    return NextResponse.json({
      success: true,
      data: formattedPosts
    })

  } catch (error) {
    console.error('인기 게시글 조회 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
