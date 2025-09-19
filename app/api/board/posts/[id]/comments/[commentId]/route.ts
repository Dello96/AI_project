import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { commentService } from '@/lib/database'
import { sanitizeComment } from '@/lib/sanitize'
import { CommentUpdateSchema } from '@/lib/comment-schemas'
import { z } from 'zod'

// 댓글 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { commentId } = params
    
    // 인증 확인
    let user = null
    let authError = null
    
    // Authorization 헤더에서 토큰 확인
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token)
      user = tokenUser
      authError = tokenError
    } else {
      // 헤더가 없으면 기본 getUser() 시도
      const { data: { user: defaultUser }, error: defaultError } = await supabase.auth.getUser()
      user = defaultUser
      authError = defaultError
    }
    
    if (authError || !user) {
      console.error('댓글 수정 인증 오류:', authError)
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const { content } = CommentUpdateSchema.parse(body)

    // 댓글 존재 확인 및 권한 검증
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (작성자 또는 관리자)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAuthor = comment.author_id === user.id
    const isAdmin = userProfile?.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: '댓글을 수정할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 콘텐츠 정화
    const sanitizedContent = sanitizeComment(content)

    // 댓글 수정
    const result = await commentService.updateComment(commentId, sanitizedContent)

    if (!result) {
      return NextResponse.json(
        { error: '댓글 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '댓글이 수정되었습니다.'
    })
  } catch (error) {
    console.error('댓글 수정 오류:', error)
    
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

// 댓글 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { commentId } = params
    
    // 인증 확인
    let user = null
    let authError = null
    
    // Authorization 헤더에서 토큰 확인
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token)
      user = tokenUser
      authError = tokenError
    } else {
      // 헤더가 없으면 기본 getUser() 시도
      const { data: { user: defaultUser }, error: defaultError } = await supabase.auth.getUser()
      user = defaultUser
      authError = defaultError
    }
    
    if (authError || !user) {
      console.error('댓글 삭제 인증 오류:', authError)
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 댓글 존재 확인 및 권한 검증
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (작성자 또는 관리자)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAuthor = comment.author_id === user.id
    const isAdmin = userProfile?.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: '댓글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 댓글 삭제 (실제 삭제)
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      console.error('댓글 삭제 오류:', deleteError)
      return NextResponse.json(
        { error: '댓글 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '댓글이 삭제되었습니다.'
    })
  } catch (error) {
    console.error('댓글 삭제 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
