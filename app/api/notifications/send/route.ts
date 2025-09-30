import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 생성 (서버 사이드)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { title, message, type, recipients, relatedId } = await request.json()

    // 필수 필드 검증
    if (!title || !message || !type || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 권한 검증 (관리자 또는 리더만 알림 발송 가능)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 사용자 역할 확인
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'leader')) {
      return NextResponse.json(
        { error: '알림 발송 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 알림 데이터베이스에 저장
    const notifications = recipients.map((recipientId: string) => ({
      user_id: recipientId,
      title,
      message,
      type,
      related_id: relatedId,
      is_read: false,
      created_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)

    if (insertError) {
      console.error('알림 저장 실패:', insertError)
      return NextResponse.json(
        { error: '알림 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 푸시 알림 발송 (실제 구현에서는 FCM 또는 웹 푸시 서비스 사용)
    try {
      await sendPushNotifications(recipients, title, message, type, relatedId)
    } catch (pushError) {
      console.error('푸시 알림 발송 실패:', pushError)
      // 푸시 알림 실패는 전체 요청을 실패시키지 않음
    }

    return NextResponse.json({
      success: true,
      message: '알림이 성공적으로 발송되었습니다.',
      count: recipients.length
    })

  } catch (error) {
    console.error('알림 발송 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 푸시 알림 발송 함수
async function sendPushNotifications(
  recipientIds: string[],
  title: string,
  message: string,
  type: string,
  relatedId?: string
) {
  try {
    // 실제 구현에서는 FCM 또는 웹 푸시 서비스를 사용
    // 여기서는 로깅만 수행

    // 향후 FCM 연동 시 이 부분을 구현
    // const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `key=${process.env.FCM_SERVER_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     to: recipientIds,
    //     notification: { title, body: message },
    //     data: { type, relatedId }
    //   })
    // })

  } catch (error) {
    console.error('푸시 알림 발송 중 오류:', error)
    throw error
  }
}

// 알림 목록 조회 API
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 사용자의 알림 목록 조회
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('알림 조회 실패:', error)
      return NextResponse.json(
        { error: '알림 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || []
    })

  } catch (error) {
    console.error('알림 조회 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
