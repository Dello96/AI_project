import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIService } from '@/lib/openai'
import { ChatMessage } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: '메시지 배열이 필요합니다.' },
        { status: 400 }
      )
    }

    const openaiService = getOpenAIService()
    const response = await openaiService.sendMessage(messages)

    return NextResponse.json({ 
      message: response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('챗봇 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
