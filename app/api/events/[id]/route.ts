import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Authorization 헤더에서 사용자 정보 가져오기
async function getUserFromAuthHeader(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  const supabase = createServerSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return null
    }
    return user
  } catch (error) {
    console.error('토큰 검증 오류:', error)
    return null
  }
}

// 이벤트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: '이벤트 ID가 필요합니다.' },
        { status: 400 }
      )
    }


    // Supabase 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // Service Role Key가 없으면 일반 클라이언트 사용
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️ Supabase Service Role Key가 설정되지 않았습니다. 일반 클라이언트를 사용합니다.')
      
      const supabase = createServerSupabaseClient()
      
      // 인증 처리 - 안전한 방식으로 개선
      let user = null
      
      // 1차: Authorization 헤더에서 사용자 정보 가져오기
      try {
        user = await getUserFromAuthHeader(request)
      } catch (error) {
      }
      
      // 2차: 헤더에서 가져오지 못했으면 쿠키 세션 확인
      if (!user) {
        try {
          const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()
          if (sessionError) {
          } else if (sessionUser) {
            user = sessionUser
          }
        } catch (error) {
        }
      }
      
      if (!user) {
        console.error('모든 인증 방법 실패')
        return NextResponse.json(
          { error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.' },
          { status: 401 }
        )
      }
      
      
      // 이벤트 존재 및 작성자 확인
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('id, created_by')
        .eq('id', id)
        .single()

      if (fetchError || !event) {
        console.error('이벤트 조회 오류:', fetchError)
        return NextResponse.json(
          { error: '이벤트를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      // 작성자 권한 확인
      if (event.created_by !== user.id) {
        console.error('권한 없음:', { eventAuthor: event.created_by, currentUser: user.id })
        return NextResponse.json(
          { error: '이벤트 삭제 권한이 없습니다.' },
          { status: 403 }
        )
      }

      // 이벤트 삭제
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('이벤트 삭제 오류:', deleteError)
        return NextResponse.json(
          { error: '이벤트 삭제에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '이벤트가 성공적으로 삭제되었습니다.'
      })
    }

    // Service Role Key를 사용하는 경우 (관리자 권한)
    const serverSupabase = createServerSupabaseClient()
    
    // 인증 처리 - Service Role Key 사용
    let user = null
    
    // 1차: Authorization 헤더에서 사용자 정보 가져오기
    try {
      user = await getUserFromAuthHeader(request)
    } catch (error) {
    }
    
    // 2차: 헤더에서 가져오지 못했으면 쿠키 세션 확인
    if (!user) {
      const supabase = createRouteHandlerClient({ cookies })
      try {
        const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()
        if (sessionError) {
        } else if (sessionUser) {
          user = sessionUser
        }
      } catch (error) {
      }
    }
    
    if (!user) {
      console.error('모든 인증 방법 실패')
      return NextResponse.json(
        { error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.' },
        { status: 401 }
      )
    }
    
    
    // 이벤트 존재 및 작성자 확인
    const { data: event, error: fetchError } = await serverSupabase
      .from('events')
      .select('id, created_by')
      .eq('id', id)
      .single()

    if (fetchError || !event) {
      console.error('이벤트 조회 오류:', fetchError)
      return NextResponse.json(
        { error: '이벤트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 작성자 권한 확인
    if (event.created_by !== user.id) {
      console.error('권한 없음:', { eventAuthor: event.created_by, currentUser: user.id })
      return NextResponse.json(
        { error: '이벤트 삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 이벤트 삭제
    const { error: deleteError } = await serverSupabase
      .from('events')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('이벤트 삭제 오류:', deleteError)
      return NextResponse.json(
        { error: '이벤트 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '이벤트가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('이벤트 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}