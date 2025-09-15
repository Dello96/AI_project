import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth-tokens'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    const payload = verifyJWT(token)
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }
    
    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'pending'
    
    // 페이지네이션 계산
    const offset = (page - 1) * limit
    
    // 쿼리 빌더
    let query = supabase
      .from('pending_members')
      .select(`
        *,
        church_domains (
          id,
          name,
          domain
        )
      `, { count: 'exact' })
    
    // 상태별 필터링
    if (status === 'pending') {
      query = query.eq('status', 'pending')
    } else if (status === 'rejected') {
      query = query.eq('status', 'rejected')
    } else if (status === 'approved') {
      query = query.eq('status', 'approved')
    }
    
    // 검색 필터링
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    }
    
    // 정렬 및 페이지네이션
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('사용자 목록 조회 오류:', error)
      return NextResponse.json(
        { error: '사용자 목록을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
    
    // 총 페이지 수 계산
    const totalPages = Math.ceil((count || 0) / limit)
    
    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
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
    console.error('대기 중 사용자 목록 API 오류:', error)
    
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
