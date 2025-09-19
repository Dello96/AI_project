import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { postService } from '@/lib/database'

// 게시글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // 게시글 조회
    const post = await postService.getPost(id)
    
    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 조회수 증가는 PostDetail 컴포넌트에서 처리

    return NextResponse.json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error('게시글 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게시글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { id } = params
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 게시글 존재 및 권한 확인
    const existingPost = await postService.getPost(id)
    if (!existingPost) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (existingPost.authorId !== user.id) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다.' },
        { status: 403 }
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

    // 게시글 수정
    const result = await postService.updatePost(id, {
      title: title.trim(),
      content: content.trim(),
      category,
      isAnonymous: isAnonymous || false,
      attachments: attachments || []
    })

    if (!result) {
      return NextResponse.json(
        { error: '게시글 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('게시글 수정 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게시글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { id } = params
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 게시글 존재 및 권한 확인
    const existingPost = await postService.getPost(id)
    if (!existingPost) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (existingPost.authorId !== user.id) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 게시글 삭제
    const result = await postService.deletePost(id)

    if (!result) {
      return NextResponse.json(
        { error: '게시글 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '게시글이 삭제되었습니다.'
    })
  } catch (error) {
    console.error('게시글 삭제 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
