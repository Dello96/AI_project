import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface EmailRequest {
  to: string[]
  subject: string
  html: string
  text?: string
}

interface EmailTemplate {
  type: 'notification' | 'event' | 'system'
  title: string
  content: string
  actionUrl?: string
}

// 이메일 템플릿 생성
function createEmailTemplate(template: EmailTemplate): string {
  const baseUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'
  
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${template.title}</title>
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
        <p>${template.title}</p>
      </div>
      
      <div class="content">
        <div style="white-space: pre-wrap;">${template.content}</div>
        
        ${template.actionUrl ? `
          <div style="text-align: center;">
            <a href="${template.actionUrl}" class="button">자세히 보기</a>
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

// 텍스트 버전 이메일 생성
function createTextEmail(template: EmailTemplate): string {
  return `
${template.title}

${template.content}

${template.actionUrl ? `자세히 보기: ${template.actionUrl}` : ''}

---
청년부 커뮤니티
이 이메일은 청년부 커뮤니티에서 발송되었습니다.
수신 거부를 원하시면 관리자에게 문의해주세요.
  `.trim()
}

serve(async (req) => {
  try {
    // CORS 헤더 설정
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST 메서드만 지원합니다.' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { to, subject, html, text }: EmailRequest = await req.json()

    // 필수 필드 검증
    if (!to || !Array.isArray(to) || to.length === 0 || !subject || !html) {
      return new Response(JSON.stringify({ error: '필수 필드가 누락되었습니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 실제 이메일 발송 로직 (여기서는 로깅만 수행)
      to,
      subject,
      htmlLength: html.length,
      textLength: text?.length || 0
    })

    // 실제 구현에서는 SendGrid, AWS SES 등의 이메일 서비스 사용
    // const emailResult = await sendEmailWithService(to, subject, html, text)

    // 성공 응답
    return new Response(JSON.stringify({
      success: true,
      message: '이메일이 성공적으로 발송되었습니다.',
      recipients: to.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    console.error('이메일 발송 중 오류:', error)
    
    return new Response(JSON.stringify({
      error: '이메일 발송 중 오류가 발생했습니다.',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
})
