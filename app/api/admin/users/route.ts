import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-guards'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// 사용자 목록 조회 (관리자 전용)
async function getUsersHandler(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status') // approved, pending

    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })

    // 검색 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // 역할 필터
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    // 승인 상태 필터
    if (status === 'approved') {
      query = query.eq('is_approved', true)
    } else if (status === 'pending') {
      query = query.eq('is_approved', false)
    }

    // 페이지네이션
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // 정렬
    query = query.order('created_at', { ascending: false })

    const { data: users, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '사용자 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export const GET = requireRole('admin')(getUsersHandler)
