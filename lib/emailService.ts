import { supabase } from './supabase'

export interface EmailNotification {
  to: string[]
  subject: string
  template: 'notification' | 'event' | 'system'
  data: {
    title: string
    content: string
    actionUrl?: string
  }
}

export interface EmailTemplate {
  type: 'notification' | 'event' | 'system'
  title: string
  content: string
  actionUrl?: string
}

class EmailService {
  private supabaseUrl: string
  private supabaseAnonKey: string

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    this.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  }

  // 이메일 알림 발송
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      // Supabase Edge Function 호출
      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          to: notification.to,
          subject: notification.subject,
          html: this.createEmailHTML(notification.data),
          text: this.createEmailText(notification.data)
        })
      })

      if (!response.ok) {
        throw new Error(`이메일 발송 실패: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('이메일 발송 성공:', result)
      return true

    } catch (error) {
      console.error('이메일 발송 오류:', error)
      return false
    }
  }

  // 공지사항 알림 이메일 발송
  async sendNotificationEmail(
    recipients: string[],
    title: string,
    content: string,
    actionUrl?: string
  ): Promise<boolean> {
    const notification: EmailNotification = {
      to: recipients,
      subject: `[청년부 커뮤니티] ${title}`,
      template: 'notification',
      data: {
        title,
        content,
        ...(actionUrl && { actionUrl })
      }
    }

    return this.sendEmail(notification)
  }

  // 일정 알림 이메일 발송
  async sendEventEmail(
    recipients: string[],
    eventTitle: string,
    eventDate: string,
    eventType: 'created' | 'updated' | 'reminder' | 'cancelled',
    actionUrl?: string
  ): Promise<boolean> {
    const typeLabels = {
      created: '새로운 일정이 등록되었습니다',
      updated: '일정이 수정되었습니다',
      reminder: '일정 리마인더',
      cancelled: '일정이 취소되었습니다'
    }

    const content = `
${typeLabels[eventType]}

일정: ${eventTitle}
날짜: ${eventDate}

자세한 내용은 아래 링크를 클릭하여 확인하세요.
    `.trim()

    const notification: EmailNotification = {
      to: recipients,
      subject: `[청년부 커뮤니티] ${typeLabels[eventType]} - ${eventTitle}`,
      template: 'event',
      data: {
        title: typeLabels[eventType],
        content,
        ...(actionUrl && { actionUrl })
      }
    }

    return this.sendEmail(notification)
  }

  // 시스템 알림 이메일 발송
  async sendSystemEmail(
    recipients: string[],
    title: string,
    content: string,
    actionUrl?: string
  ): Promise<boolean> {
    const notification: EmailNotification = {
      to: recipients,
      subject: `[청년부 커뮤니티] ${title}`,
      template: 'system',
      data: {
        title,
        content,
        ...(actionUrl && { actionUrl })
      }
    }

    return this.sendEmail(notification)
  }

  // HTML 이메일 생성
  private createEmailHTML(data: EmailNotification['data']): string {
    return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>청년부 커뮤니티</h1>
          <p>${data.title}</p>
        </div>
        
        <div class="content">
          <div style="white-space: pre-wrap;">${data.content}</div>
          
          ${data.actionUrl ? `
            <div style="text-align: center;">
              <a href="${data.actionUrl}" class="button">자세히 보기</a>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>이 이메일은 청년부 커뮤니티에서 발송되었습니다.</p>
            <p>수신 거부를 원하시면 관리자에게 문의해주세요.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // 텍스트 이메일 생성
  private createEmailText(data: EmailNotification['data']): string {
    return `
${data.title}

${data.content}

${data.actionUrl ? `자세히 보기: ${data.actionUrl}` : ''}

---
청년부 커뮤니티
이 이메일은 청년부 커뮤니티에서 발송되었습니다.
수신 거부를 원하시면 관리자에게 문의해주세요.
    `.trim()
  }

  // 사용자 이메일 주소 조회
  async getUserEmails(userIds: string[]): Promise<string[]> {
    try {
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('email')
        .in('id', userIds)
        .eq('is_approved', true)

      if (error) {
        console.error('사용자 이메일 조회 오류:', error)
        return []
      }

      return users?.map(user => user.email) || []
    } catch (error) {
      console.error('사용자 이메일 조회 중 오류:', error)
      return []
    }
  }

  // 교회 도메인별 사용자 이메일 조회
  async getEmailsByChurchDomain(churchDomainId: string): Promise<string[]> {
    try {
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('church_domain_id', churchDomainId)
        .eq('is_approved', true)

      if (error) {
        console.error('교회 도메인별 이메일 조회 오류:', error)
        return []
      }

      return users?.map(user => user.email) || []
    } catch (error) {
      console.error('교회 도메인별 이메일 조회 중 오류:', error)
      return []
    }
  }

  // 가입 승인 알림 이메일 발송
  async sendApprovalEmail(
    email: string,
    name: string,
    churchName: string
  ): Promise<boolean> {
    const content = `
안녕하세요 ${name}님,

청년부 커뮤니티 가입 요청이 승인되었습니다!

교회: ${churchName}
승인일: ${new Date().toLocaleDateString('ko-KR')}

이제 로그인하여 커뮤니티를 이용하실 수 있습니다.
다양한 기능들을 통해 청년부 활동에 참여해보세요.

감사합니다.
청년부 커뮤니티 관리자
    `.trim()

    return this.sendSystemEmail(
      [email],
      '가입 승인 완료',
      content,
      `${process.env.NEXT_PUBLIC_APP_URL}/login`
    )
  }

  // 가입 거절 알림 이메일 발송
  async sendRejectionEmail(
    email: string,
    name: string,
    reason: string
  ): Promise<boolean> {
    const content = `
안녕하세요 ${name}님,

청년부 커뮤니티 가입 요청에 대해 안타깝게도 승인되지 않았습니다.

거절 사유: ${reason}

추가 문의사항이 있으시면 관리자에게 직접 연락해주세요.
다시 한번 가입 요청을 원하시면 언제든지 가능합니다.

감사합니다.
청년부 커뮤니티 관리자
    `.trim()

    return this.sendSystemEmail(
      [email],
      '가입 요청 결과 안내',
      content
    )
  }
}

export const emailService = new EmailService()
