import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { postService } from '@/lib/database'

// 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'latest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // 게시글 조회
    const result = await postService.getPosts({
      category: category || undefined,
      search: search || undefined,
      sortBy: sortBy as 'latest' | 'popular' | 'views',
      page,
      limit
    })

    if (!result) {
      return NextResponse.json(
        { error: '게시글 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('게시글 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게시글 작성
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

    // 요청 본문 파싱
    const body = await request.json()
    const { title, content, category, isAnonymous, attachments } = body

    // 필수 필드 검증
    if (!title?.trim() || !content?.trim() || !category) {
      return NextResponse.json(
        { error: '제목, 내용, 카테고리는 필수입니다.' },
        { status: 400 }
      )
    }

    // 게시글 생성
    const result = await postService.createPost({
      title: title.trim(),
      content: content.trim(),
      category,
      authorId: user.id,
      isAnonymous: isAnonymous || false,
      attachments: attachments || []
    })

    if (!result) {
      return NextResponse.json(
        { error: '게시글 작성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 })
  } catch (error) {
    console.error('게시글 작성 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
