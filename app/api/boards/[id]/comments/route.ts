import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { commentService } from '@/lib/database'

// 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = params
    
    // 댓글 목록 조회
    const comments = await commentService.getComments(postId)
    
    return NextResponse.json({
      success: true,
      data: comments
    })
  } catch (error) {
    console.error('댓글 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { id: postId } = params
    
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
    const { content, isAnonymous, parentId } = body

    // 필수 필드 검증
    if (!content?.trim()) {
      return NextResponse.json(
        { error: '댓글 내용은 필수입니다.' },
        { status: 400 }
      )
    }

    // 댓글 생성
    const result = await commentService.createComment({
      content: content.trim(),
      authorId: user.id,
      postId,
      isAnonymous: isAnonymous || false,
      parentId: parentId || null
    })

    if (!result) {
      return NextResponse.json(
        { error: '댓글 작성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 })
  } catch (error) {
    console.error('댓글 작성 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
