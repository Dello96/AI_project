import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-guards'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// 사용자 역할 수정 (관리자 전용)
async function updateUserHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: userId } = params
    
    // 요청 본문 파싱
    const body = await request.json()
    const { role, isApproved } = body

    // 입력 값 검증
    if (role && !['member', 'leader', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: '유효하지 않은 역할입니다.' },
        { status: 400 }
      )
    }

    // 업데이트할 데이터 준비
    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (isApproved !== undefined) updateData.is_approved = isApproved

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 데이터가 없습니다.' },
        { status: 400 }
      )
    }

    // 사용자 정보 업데이트
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: '사용자 정보가 업데이트되었습니다.'
    })
  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error)
    return NextResponse.json(
      { error: '사용자 정보 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자 삭제 (관리자 전용)
async function deleteUserHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: userId } = params

    // 사용자 프로필 삭제
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: '사용자가 삭제되었습니다.'
    })
  } catch (error) {
    console.error('사용자 삭제 오류:', error)
    return NextResponse.json(
      { error: '사용자 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export const PUT = requireRole('admin')(updateUserHandler)
export const DELETE = requireRole('admin')(deleteUserHandler)
