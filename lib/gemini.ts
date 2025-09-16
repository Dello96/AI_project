import { ChatMessage } from '@/types'

export class GeminiService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    // 환경 변수 로딩 강화
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY || ''
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
    
    console.log('GeminiService 초기화:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length,
      apiKeyPrefix: `${this.apiKey.substring(0, 10)}...`
    })
    
    if (!this.apiKey) {
      console.error('GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다. 챗봇 기능이 제한됩니다.')
      console.error('현재 환경 변수들:', Object.keys(process.env).filter(key => key.includes('GEMINI')))
    }
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) {
      console.error('GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다.')
      return '죄송합니다. AI 서비스가 현재 사용할 수 없습니다. 관리자에게 문의해주세요.'
    }

    try {
      // Gemini API 형식으로 메시지 변환
      const geminiMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      console.log('Gemini API 호출 중...', { apiKey: `${this.apiKey.substring(0, 10)}...` })

      const response = await fetch(`${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      })

      console.log('Gemini API 응답 상태:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Gemini API 오류 응답:', errorData)
        throw new Error(`Gemini API 오류: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('Gemini API 응답 데이터:', data)
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text
      } else {
        console.error('예상치 못한 응답 형식:', data)
        throw new Error('응답 형식이 올바르지 않습니다.')
      }
    } catch (error) {
      console.error('Gemini API 오류:', error)
      return '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }
  }

  async generateGreeting(): Promise<string> {
    const greetings: string[] = [
      '안녕하세요! 교회 청년부 AI 어시스턴트입니다. 무엇을 도와드릴까요? 🙏',
      '반갑습니다! 청년부 커뮤니티에서 궁금한 것이 있으시면 언제든 물어보세요! ✨',
      '하나님의 평강이 함께하시길! 청년부 AI 어시스턴트가 도와드리겠습니다. 😊',
      '안녕하세요! 공지사항, 일정, 게시판 사용법 등 무엇이든 물어보세요! 💙'
    ]
    
    const randomIndex = Math.floor(Math.random() * greetings.length)
    return greetings[randomIndex] as string
  }
}

// 싱글톤 인스턴스
let geminiService: GeminiService | null = null

export function getGeminiService(): GeminiService {
  if (!geminiService) {
    geminiService = new GeminiService()
  }
  return geminiService
}
