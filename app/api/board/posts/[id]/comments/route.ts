import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { commentService } from '@/lib/database'
import { sanitizeComment } from '@/lib/sanitize'
import { CommentCreateSchema, CommentQuerySchema } from '@/lib/comment-schemas'
import { z } from 'zod'

// 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = params
    const { searchParams } = new URL(request.url)
    const { page, limit } = CommentQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    })
    
    // 게시글 존재 확인
    const supabase = createServerSupabaseClient()
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .is('deleted_at', null)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    // 댓글 목록 조회
    const comments = await commentService.getComments(postId)
    
    // 페이징 처리
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedComments = comments.slice(startIndex, endIndex)
    
    return NextResponse.json({
      success: true,
      data: paginatedComments,
      pagination: {
        page,
        limit,
        total: comments.length,
        totalPages: Math.ceil(comments.length / limit)
      }
    })
  } catch (error) {
    console.error('댓글 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '댓글 목록을 불러오는데 실패했습니다.' },
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

    // 게시글 존재 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .is('deleted_at', null)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const { content, isAnonymous, parentId } = CommentCreateSchema.parse(body)

    // 콘텐츠 정화
    const sanitizedContent = sanitizeComment(content)

    // 댓글 생성
    const result = await commentService.createComment({
      content: sanitizedContent,
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
      data: result,
      message: '댓글이 작성되었습니다.'
    }, { status: 201 })
  } catch (error) {
    console.error('댓글 작성 오류:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || '입력 데이터가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
