import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sanitizeContent, sanitizeTitle } from '@/lib/sanitize'
import { requireAuth, canCreatePost, canCreateNotice } from '@/lib/post-auth'

// 게시글 생성 스키마
const CreatePostSchema = z.object({
  title: z.string().min(2, '제목은 2자 이상 입력해주세요.').max(100, '제목은 100자 이하로 입력해주세요.'),
  content: z.string().min(10, '내용은 10자 이상 입력해주세요.').max(5000, '내용은 5000자 이하로 입력해주세요.'),
  category: z.enum(['notice', 'free', 'qna'], { message: '카테고리를 선택해주세요.' }),
  isAnonymous: z.boolean().default(true),
  authorId: z.string().optional(),
  attachments: z.array(z.string()).optional()
})

// 게시글 조회 스키마
const GetPostsSchema = z.object({
  category: z.enum(['notice', 'free', 'qna']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['latest', 'popular', 'views']).default('latest'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10)
})

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json()
    console.log('게시글 작성 요청:', body)
    
    const parsed = CreatePostSchema.safeParse(body)
    
    if (!parsed.success) {
      console.error('게시글 작성 스키마 검증 실패:', parsed.error.issues)
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: parsed.error.issues },
        { status: 400 }
      )
    }
    
    const { title, content, category, isAnonymous, attachments, authorId } = parsed.data
    
    // 콘텐츠 정화
    const sanitizedTitle = sanitizeTitle(title)
    const sanitizedContent = sanitizeContent(content)
    
    // Supabase 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. 모의 데이터를 사용합니다.')
      
      // 모의 데이터 반환
      const mockPost = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: sanitizedTitle,
        content: sanitizedContent,
        category,
        authorName: '익명',
        isAnonymous: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        attachments: []
      }
      
      console.log('모의 게시글 생성:', mockPost)
      
      return NextResponse.json({
        success: true,
        message: '게시글이 성공적으로 작성되었습니다. (모의 데이터)',
        post: mockPost
      })
    }

    // Service Role Key가 없으면 일반 클라이언트 사용
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️ Supabase Service Role Key가 설정되지 않았습니다. 일반 클라이언트를 사용합니다.')
      
      const supabase = createServerSupabaseClient()
      
      // 익명 사용자 ID
      const anonymousUserId = '00000000-0000-0000-0000-000000000000'
      
      const { data: post, error: createError } = await supabase
        .from('posts')
        .insert({
          title: sanitizedTitle,
          content: sanitizedContent,
          category,
          author_id: anonymousUserId,
          is_anonymous: true
        })
        .select()
        .single()
      
      if (createError) {
        console.error('게시글 생성 오류:', createError)
        return NextResponse.json(
          { error: '게시글 작성에 실패했습니다.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: '게시글이 성공적으로 작성되었습니다.',
        post: {
          id: post.id,
          title: post.title,
          content: post.content,
          category: post.category,
          authorName: '익명',
          isAnonymous: post.is_anonymous,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          attachments: []
        }
      })
    }

    // 실제 Supabase 연결 사용
    const serverSupabase = createServerSupabaseClient()
    
    // 익명 사용자 ID (데이터베이스에 미리 생성된 ID 사용)
    const anonymousUserId = '00000000-0000-0000-0000-000000000000'
    
    // 먼저 익명 사용자 프로필이 있는지 확인하고 없으면 생성
    const { data: existingUser } = await serverSupabase
      .from('user_profiles')
      .select('id')
      .eq('id', anonymousUserId)
      .single()
    
    if (!existingUser) {
      // 익명 사용자 프로필 생성 (외래키 제약조건 무시)
      const { error: userError } = await serverSupabase
        .from('user_profiles')
        .insert({
          id: anonymousUserId,
          email: 'anonymous@system.local',
          name: '익명 사용자',
          role: 'member',
          is_approved: true
        })
      
      if (userError) {
        console.error('익명 사용자 프로필 생성 오류:', userError)
      }
    }
    
      const { data: post, error: createError } = await serverSupabase
        .from('posts')
        .insert({
          title: sanitizedTitle,
          content: sanitizedContent,
          category,
          author_id: anonymousUserId,
          is_anonymous: true
        })
        .select()
        .single()
      
      if (createError) {
        console.error('게시글 생성 오류:', createError)
        console.error('오류 상세 정보:', {
          code: createError?.code,
          message: createError?.message,
          details: createError?.details,
          hint: createError?.hint
        })
        return NextResponse.json(
          { error: `게시글 작성에 실패했습니다: ${createError?.message}` },
          { status: 500 }
        )
      }
    
    return NextResponse.json({
      success: true,
      message: '게시글이 성공적으로 작성되었습니다.',
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        authorName: '익명',
        isAnonymous: post.is_anonymous,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        attachments: []
      }
    })
    
  } catch (error) {
    console.error('게시글 작성 API 오류:', error)
    
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const parsed = GetPostsSchema.safeParse(Object.fromEntries(searchParams))
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: '잘못된 요청 파라미터입니다.', details: parsed.error.issues },
        { status: 400 }
      )
    }
    
    const { category, search, sortBy, page, limit } = parsed.data
    
    // 페이지네이션 계산
    const offset = (page - 1) * limit
    
    // 쿼리 빌더 (삭제되지 않은 게시글만) - 서버 사이드 클라이언트 사용
    const serverSupabase = createServerSupabaseClient()
    
    let query = serverSupabase
      .from('posts')
      .select('*', { count: 'exact' })
    
    // 카테고리 필터
    if (category) {
      query = query.eq('category', category)
    }
    
    // 검색 필터
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,content.ilike.%${search.trim()}%`)
    }
    
    // 정렬
    switch (sortBy) {
      case 'latest':
        query = query.order('created_at', { ascending: false })
        break
      case 'popular':
        query = query.order('like_count', { ascending: false })
        break
      case 'views':
        query = query.order('view_count', { ascending: false })
        break
    }
    
    // 페이지네이션
    const { data: posts, error, count } = await query
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('게시글 조회 오류:', error)
      console.error('오류 상세 정보:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { error: '게시글 목록을 불러오는데 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }
    
    // 총 페이지 수 계산
    const totalPages = Math.ceil((count || 0) / limit)
    
    // 응답 데이터 가공
    const formattedPosts = (posts || []).map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      authorName: post.is_anonymous ? '익명' : '알 수 없음',
      isAnonymous: post.is_anonymous || true,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      viewCount: post.view_count || 0,
      likeCount: post.like_count || 0,
      commentCount: 0, // 임시로 0으로 설정
      attachments: post.attachments || []
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: count || 0,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })
    
  } catch (error) {
    console.error('게시글 조회 API 오류:', error)
    
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
