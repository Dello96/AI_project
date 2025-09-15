import { ChatMessage } from '@/types'

export class OpenAIService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ''
    this.baseUrl = 'https://api.openai.com/v1'
    
    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY가 설정되지 않았습니다. 챗봇 기능이 제한됩니다.')
    }
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) {
      return '죄송합니다. AI 서비스가 현재 사용할 수 없습니다. 관리자에게 문의해주세요.'
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `당신은 교회 청년부 커뮤니티의 AI 어시스턴트입니다. 
              다음 가이드라인을 따라 답변해주세요:
              
              1. 친근하고 따뜻한 톤으로 답변하세요
              2. 교회와 청년부 관련 질문에 도움이 되는 정보를 제공하세요
              3. 성경 구절이나 영적인 조언이 필요한 경우 적절히 인용하세요
              4. 공지사항, 일정, 게시판 사용법에 대해 안내해주세요
              5. 개인적인 문제나 심각한 상담이 필요한 경우 상담사나 목사님께 문의하도록 안내하세요
              6. 답변은 간결하고 이해하기 쉽게 작성하세요
              7. 한국어로 답변하세요`
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API 오류: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || '죄송합니다. 응답을 생성할 수 없습니다.'
    } catch (error) {
      console.error('OpenAI API 오류:', error)
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
let openaiService: OpenAIService | null = null

export function getOpenAIService(): OpenAIService {
  if (!openaiService) {
    openaiService = new OpenAIService()
  }
  return openaiService
}
