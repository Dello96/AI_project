import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { sanitizeContent, sanitizeTitle } from '@/lib/sanitize'
import { requireAuth, requirePostPermission, getPostById } from '@/lib/post-auth'

// 게시글 수정 스키마
const UpdatePostSchema = z.object({
  title: z.string().min(2, '제목은 2자 이상 입력해주세요.').max(100, '제목은 100자 이하로 입력해주세요.').optional(),
  content: z.string().min(10, '내용은 10자 이상 입력해주세요.').max(5000, '내용은 5000자 이하로 입력해주세요.').optional(),
  category: z.enum(['notice', 'free', 'qna']).optional(),
  isAnonymous: z.boolean().optional(),
  attachments: z.array(z.string()).optional()
})

// GET /api/board/posts/[id] - 게시글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: '게시글 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 게시글 조회
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        comments:comments(id, content, author_id, is_anonymous, created_at)
      `)
      .eq('id', id)
      .single()

    if (error || !post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 응답 데이터 가공 (조회수 증가는 별도 API에서 처리)
    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      authorName: post.is_anonymous ? '익명' : post.author?.name || '알 수 없음',
      authorId: post.author_id,
      isAnonymous: post.is_anonymous,
      viewCount: post.view_count,
      likeCount: post.like_count,
      commentCount: post.comment_count,
      attachments: post.attachments || [],
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      comments: post.comments || []
    }

    return NextResponse.json({
      success: true,
      data: formattedPost
    })

  } catch (error) {
    console.error('게시글 조회 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}

// PATCH /api/board/posts/[id] - 게시글 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: '게시글 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 권한 확인
    const permission = await requirePostPermission(request, id, 'update')
    if (!permission) {
      return NextResponse.json(
        { error: '게시글 수정 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { user, post } = permission

    // 요청 본문 파싱
    const body = await request.json()
    const parsed = UpdatePostSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const updateData = parsed.data

    // 공지사항 작성 권한 확인
    if (updateData.category === 'notice' && !permission.user.role.includes('leader') && !permission.user.role.includes('admin')) {
      return NextResponse.json(
        { error: '공지사항은 리더 이상만 작성할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 업데이트할 데이터 준비
    const updateFields: any = {
      updated_at: new Date().toISOString()
    }

    if (updateData.title !== undefined) {
      updateFields.title = sanitizeTitle(updateData.title)
    }

    if (updateData.content !== undefined) {
      updateFields.content = sanitizeContent(updateData.content)
    }

    if (updateData.category !== undefined) {
      updateFields.category = updateData.category
    }

    if (updateData.isAnonymous !== undefined) {
      updateFields.is_anonymous = updateData.isAnonymous
      updateFields.author_name = updateData.isAnonymous ? '익명' : user.email.split('@')[0]
    }

    if (updateData.attachments !== undefined) {
      updateFields.attachments = updateData.attachments
    }

    // 게시글 업데이트
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('게시글 수정 오류:', updateError)
      return NextResponse.json(
        { error: '게시글 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '게시글이 성공적으로 수정되었습니다.',
      data: {
        id: updatedPost.id,
        title: updatedPost.title,
        content: updatedPost.content,
        category: updatedPost.category,
        authorName: updatedPost.author_name,
        isAnonymous: updatedPost.is_anonymous,
        updatedAt: updatedPost.updated_at
      }
    })

  } catch (error) {
    console.error('게시글 수정 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}

// DELETE /api/board/posts/[id] - 게시글 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: '게시글 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 권한 확인
    const permission = await requirePostPermission(request, id, 'delete')
    if (!permission) {
      return NextResponse.json(
        { error: '게시글 삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 게시글 삭제 (실제 삭제)
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('게시글 삭제 오류:', deleteError)
      return NextResponse.json(
        { error: '게시글 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '게시글이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('게시글 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
