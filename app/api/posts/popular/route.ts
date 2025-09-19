import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('인기 게시글 조회 API 호출')
    const supabase = createServerSupabaseClient()
    
    // 모든 게시글을 조회하여 클라이언트에서 정렬
    const { data: allPosts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        category,
        is_anonymous,
        view_count,
        like_count,
        created_at,
        author_id
      `)

    console.log('전체 게시글 조회 결과:', { count: allPosts?.length, error })

    if (error) {
      console.error('게시글 조회 오류:', error)
      return NextResponse.json(
        { error: '게시글을 불러오는데 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    // 게시글이 없는 경우 빈 배열 반환
    if (!allPosts || allPosts.length === 0) {
      console.log('게시글이 없습니다.')
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // 좋아요 수 기준으로 정렬 (같으면 조회수, 그 다음은 생성일)
    const sortedPosts = allPosts
      .sort((a, b) => {
        // 1순위: 좋아요 수 (내림차순)
        const likeDiff = (b.like_count || 0) - (a.like_count || 0)
        if (likeDiff !== 0) return likeDiff
        
        // 2순위: 조회수 (내림차순)
        const viewDiff = (b.view_count || 0) - (a.view_count || 0)
        if (viewDiff !== 0) return viewDiff
        
        // 3순위: 생성일 (내림차순 - 최신순)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      .slice(0, 5)

    console.log('정렬된 상위 5개 게시글:', sortedPosts.map((p, index) => ({ 
      rank: index + 1,
      id: p.id, 
      title: p.title, 
      like_count: p.like_count,
      view_count: p.view_count,
      created_at: p.created_at
    })))

    const posts = sortedPosts

    // 각 게시글의 작성자 정보 조회
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        if (post.is_anonymous) {
          return {
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.category,
            isAnonymous: post.is_anonymous,
            viewCount: post.view_count || 0,
            likeCount: post.like_count || 0,
            commentCount: 0, // comment_count 컬럼이 없으므로 기본값 0
            author: null,
            createdAt: post.created_at
          }
        }

        // 익명이 아닌 경우 작성자 정보 조회
        const { data: author } = await supabase
          .from('user_profiles')
          .select('id, name, email')
          .eq('id', post.author_id)
          .single()

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          category: post.category,
          isAnonymous: post.is_anonymous,
          viewCount: post.view_count || 0,
          likeCount: post.like_count || 0,
          commentCount: 0, // comment_count 컬럼이 없으므로 기본값 0
          author,
          createdAt: post.created_at
        }
      })
    )

    console.log('가공된 인기 게시글:', postsWithAuthors)

    return NextResponse.json({
      success: true,
      data: postsWithAuthors
    })

  } catch (error) {
    console.error('인기 게시글 조회 서버 오류:', error)
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
