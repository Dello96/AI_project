import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const UploadSchema = z.object({
  file: z.any(), // File 객체
  messageId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰으로 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('인증 오류:', authError)
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }


    const formData = await request.formData()
    const file = formData.get('file') as File
    const messageId = formData.get('messageId') as string

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 })
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: '파일 크기는 10MB를 초과할 수 없습니다.' }, { status: 400 })
    }

    // 허용된 파일 타입
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: '지원되지 않는 파일 형식입니다. 이미지, PDF, 텍스트 파일만 업로드 가능합니다.' 
      }, { status: 400 })
    }

    // 파일명 생성 (중복 방지)
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop()
    const fileName = `chat_${timestamp}_${randomString}.${fileExtension}`

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('파일 업로드 오류:', uploadError)
      return NextResponse.json({ 
        error: '파일 업로드에 실패했습니다.',
        details: uploadError.message 
      }, { status: 500 })
    }


    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName)


    // 썸네일 생성 (이미지인 경우)
    let thumbnailUrl = null
    if (file.type.startsWith('image/')) {
      try {
        // 간단한 썸네일 생성 (실제로는 더 정교한 이미지 리사이징이 필요)
        thumbnailUrl = urlData.publicUrl
      } catch (error) {
        console.error('썸네일 생성 오류:', error)
      }
    }

    const attachment = {
      id: `attachment_${timestamp}_${randomString}`,
      filename: fileName,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: urlData.publicUrl,
      thumbnailUrl: thumbnailUrl
    }


    return NextResponse.json({
      success: true,
      attachment
    })

  } catch (error) {
    console.error('파일 업로드 API 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
