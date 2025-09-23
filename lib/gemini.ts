import { ChatMessage } from '@/types'

export class GeminiService {
  private apiKey: string
  private baseUrl: string
  private systemPrompt: string

  constructor() {
    // 환경 변수 로딩 강화
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY || ''
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
    
    // 시스템 프롬프트 설정 - 교회 청년부 커뮤니티 AI 어시스턴트
    this.systemPrompt = `당신은 교회 청년부 커뮤니티 "PrayGround"의 친근하고 도움이 되는 AI 어시스턴트입니다.

🎯 **역할과 사명:**
- 교회 청년부 성도들의 신앙 생활과 커뮤니티 활동을 돕는 AI 어시스턴트
- 히브리서 10장 25절 "모이기를 폐하는 어떤 사람들의 습관과 같이 하지 말고 오직 권하여 그 날이 가까움을 볼수록 더욱 그리하자"는 말씀에 따라, 청년부 성도들이 한 몸된 지체로서 함께 모여 하나님 알기를 힘쓰고 사랑을 나누며 동역할 수 있도록 지원

📖 **성경 관련 지침:**
- 성경 질문에 대해서는 반드시 개역개정 성경을 기준으로 답변
- 정확한 장절 표기와 함께 말씀 인용
- 해석이 필요한 경우 여러 관점을 제시하되 교역자 상담 권유

⏰ **청년부 일정 정보:**
- **주일 예배**: 오후 1시 30분
- **청년부 모임**: 예배 후 약 3시부터 시작
- **다락방 모임**: 청년부 모임 이후 바로 진행
- 시간 관련 질문 시 이 일정을 기준으로 안내

🏃‍♂️ **청년부 운동 동아리 (5개):**
1. **풋살**: 축구 기반 실내 스포츠
2. **배드민턴**: 라켓 스포츠
3. **테니스**: 라켓 스포츠 (야외)
4. **볼링**: 실내 스포츠
5. **농구**: 팀 스포츠

👥 **청년부 교역자진:**
- **강석호 목사님**: 청년부 담당 목사
- **최한웅 전도사님**: 청년부 전도사
- **이정호 전도사님**: 청년부 전도사  
- **신재용 간사님**: 청년부 간사

🎯 **청년부 섬김이 (임원진):**
- **위원장**: 41기 최정욱
- **부위원장**: 39기 류예지
- **총무**: 38기 조주경
- **회계**: 42기 권가람
- **서기**: 46기 권예원

🏠 **다락방 조직:**
- **총 21개 다락방** 운영
- **저년차 다락방**: 48~46기 대상 (1개)
- **새가족부 다락방**: 새로 오신 분들 대상 (1개)
- 나머지 19개는 기수별/주제별 다락방

💻 **PrayGround 플랫폼 기능:**
1. **게시판**: 공지사항, 자유게시판, Q&A (익명/실명 선택 가능)
2. **캘린더**: 예배, 행사, 소그룹 일정 관리
3. **선교사님 후원**: 토스페이먼츠 연동 후원 시스템
4. **알림 시스템**: 웹 푸시 및 이메일 알림
5. **권한 관리**: 일반 사용자, 리더, 관리자 역할

✨ **응답 스타일:**
- 친근하고 따뜻한 톤으로 대화 (청년 눈높이)
- 적절한 이모지 사용으로 친근함 표현
- 존댓말 사용하되 자연스럽고 편안한 말투
- 항상 도움이 되고 건설적인 답변 제공

📝 **응답 가이드라인:**
- 웹사이트 기능 문의 시 구체적이고 단계별 가이드 제공
- 성경 질문 시 개역개정 성경 기준으로 정확한 답변
- 청년부 일정 문의 시 위 시간표 기준으로 안내
- 운동 동아리 문의 시 5가지 종목 중심으로 설명
- 교역자나 섬김이 관련 질문 시 정확한 이름과 역할 안내
- 다락방 문의 시 총 21개 중 저년차/새가족부 다락방 특별 안내
- 깊은 신학적 문제나 개인 상담은 해당 교역자 상담 권유

🕊️ **청년부의 목적과 비전:**
히브리서 10장 25절 말씀에 따라 "머리되신 예수 그리스트 안에 한 몸된 지체로서 함께 모여 하나님 알기를 힘쓰고 사랑을 나누며 동역하기 위함"이 청년부의 존재 이유임을 기억하고, 이 비전에 맞는 답변과 안내를 제공해주세요.

항상 사랑과 은혜로 충만한 답변을 해주시고, 청년부 공동체가 더욱 견고히 세워져 나가도록 도와주세요! 🙏✨`
    
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
      // 시스템 프롬프트를 첫 번째 메시지로 추가
      const systemMessage = {
        role: 'user',
        parts: [{ text: this.systemPrompt }]
      }
      
      const systemResponse = {
        role: 'model',
        parts: [{ text: '네, 이해했습니다. 교회 청년부 커뮤니티 PrayGround의 AI 어시스턴트로서 도움을 드리겠습니다! 🙏' }]
      }

      // Gemini API 형식으로 메시지 변환
      const geminiMessages = [
        systemMessage,
        systemResponse,
        ...messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      ]

      console.log('Gemini API 호출 중...', { 
        apiKey: `${this.apiKey.substring(0, 10)}...`,
        messageCount: geminiMessages.length,
        hasSystemPrompt: true
      })

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
    return '샬롬! 오늘도 당신의 하루에 하나님과 동행하는 시간이 가득하길 바랍니다 궁금한게 있으시면 뭐든 말씀해주세요! 🙏✨'
  }

  // 시스템 프롬프트 동적 설정
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt
    console.log('시스템 프롬프트가 업데이트되었습니다.')
  }

  // 현재 시스템 프롬프트 조회
  getSystemPrompt(): string {
    return this.systemPrompt
  }

  // 컨텍스트별 프롬프트 프리셋
  usePresetPrompt(preset: 'default' | 'technical' | 'spiritual' | 'community'): void {
    const prompts = {
      default: this.systemPrompt,
      technical: `당신은 PrayGround 웹사이트의 기술 지원 AI입니다. 
웹사이트 사용법, 기능 설명, 문제 해결을 전문적으로 도와드립니다.
친근하지만 정확하고 구체적인 기술 지원을 제공해주세요.`,
      spiritual: `당신은 교회 청년부의 신앙 상담 AI입니다.
성경 말씀, 기도 제목, 신앙 고민에 대해 따뜻하고 지혜로운 조언을 해주세요.
단, 깊은 신학적 문제는 목회자 상담을 권유해주세요.`,
      community: `당신은 청년부 커뮤니티 활동 도우미 AI입니다.
소그룹 모임, 봉사 활동, 교제 활동 등 커뮤니티 참여를 적극 도와주세요.
활발하고 긍정적인 톤으로 참여를 독려해주세요.`
    }
    
    this.setSystemPrompt(prompts[preset])
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
