import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service Role Key를 사용한 Supabase 클라이언트 생성
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// RLS를 우회하기 위한 raw SQL 실행 함수
async function executeRawSQL(query: string, params: any[] = []) {
  const { data, error } = await supabaseAdmin.rpc('exec_sql', {
    query,
    params
  })
  return { data, error }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== 좋아요 API 호출 시작 ===')
    console.log('Post ID:', params.id)
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    console.log('Authorization 헤더:', authHeader ? '존재' : '없음')
    
    let user = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      if (!token) {
        return NextResponse.json({ error: '유효하지 않은 인증 토큰입니다.' }, { status: 401 })
      }
      console.log('토큰 길이:', token.length)
      
      // 토큰으로 사용자 정보 확인
      console.log('사용자 인증 확인 중...')
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

      if (authError || !authUser) {
        console.error('사용자 인증 실패:', authError)
        return NextResponse.json({ error: '유효하지 않은 인증 정보입니다.' }, { status: 401 })
      }
      
      user = authUser
      console.log('사용자 인증 성공:', user.id)
    } else {
      console.log('인증 헤더가 없거나 잘못된 형식 - 익명 사용자로 처리')
      // 익명 사용자 ID 생성 (일관성을 위해)
      user = { id: 'anonymous-user' }
    }

    const postId = params.id

    // 게시글의 좋아요 정보를 한 번에 조회
    console.log('게시글 좋아요 정보 조회 중...')
    const { data: currentPost, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, like_count, liked_by')
      .eq('id', postId)
      .single()

    if (postError || !currentPost) {
      console.error('게시글 조회 실패:', postError)
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    console.log('게시글 조회 성공:', currentPost)

    const likedBy = currentPost.liked_by || []
    const isCurrentlyLiked = likedBy.includes(user.id)
    console.log('현재 좋아요 상태:', isCurrentlyLiked ? '좋아요됨' : '좋아요 안됨')

    if (isCurrentlyLiked) {
      // 이미 좋아요를 눌렀으면 취소
      const newLikedBy = likedBy.filter((id: string) => id !== user.id)
      const newLikeCount = Math.max(0, (currentPost.like_count || 0) - 1)
      
      const { error: updateError } = await supabaseAdmin
        .from('posts')
        .update({ 
          like_count: newLikeCount,
          liked_by: newLikedBy
        })
        .eq('id', postId)

      if (updateError) {
        console.error('좋아요 취소 오류:', updateError)
        return NextResponse.json({ error: '좋아요 취소에 실패했습니다.' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        liked: false,
        likeCount: newLikeCount,
        message: '좋아요가 취소되었습니다.' 
      })
    } else {
      // 좋아요 추가
      const newLikedBy = [...likedBy, user.id]
      const newLikeCount = (currentPost.like_count || 0) + 1
      
      const { error: updateError } = await supabaseAdmin
        .from('posts')
        .update({ 
          like_count: newLikeCount,
          liked_by: newLikedBy
        })
        .eq('id', postId)

      if (updateError) {
        console.error('좋아요 추가 오류:', updateError)
        return NextResponse.json({ error: '좋아요 추가에 실패했습니다.' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        liked: true,
        likeCount: newLikeCount,
        message: '좋아요가 추가되었습니다.' 
      })
    }
  } catch (error) {
    console.error('좋아요 처리 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authorization 헤더에서 토큰 추출 (선택적)
    const authHeader = request.headers.get('authorization')
    let user = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user: authUser } } = await supabaseAdmin.auth.getUser(token)
      user = authUser
    }

    const postId = params.id

    // 게시글의 좋아요 수와 liked_by 정보 조회
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('like_count, liked_by')
      .eq('id', postId)
      .single()

    if (postError) {
      console.error('게시글 조회 오류:', postError)
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    let isLiked = false
    if (user) {
      // liked_by JSONB 배열에서 현재 사용자 ID 확인
      const likedBy = post.liked_by || []
      isLiked = likedBy.includes(user.id)
    }

    return NextResponse.json({
      success: true,
      likeCount: post.like_count || 0,
      isLiked
    })
  } catch (error) {
    console.error('좋아요 상태 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
