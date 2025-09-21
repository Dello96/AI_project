import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 결제 요청 스키마
const PaymentRedirectSchema = z.object({
  amount: z.string().transform(Number),
  orderId: z.string().min(1, '주문 ID는 필수입니다.'),
  orderName: z.string().min(1, '주문명은 필수입니다.'),
  customerName: z.string().optional(),
  customerEmail: z.string().optional().refine(
    (val) => !val || val === '' || z.string().email().safeParse(val).success,
    { message: '올바른 이메일 형식이 아닙니다.' }
  ),
  successUrl: z.string().url('올바른 성공 URL을 입력해주세요.'),
  failUrl: z.string().url('올바른 실패 URL을 입력해주세요.')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams)
    
    const parsed = PaymentRedirectSchema.safeParse(params)
    
    if (!parsed.success) {
      console.error('결제 파라미터 검증 실패:', {
        params,
        errors: parsed.error.issues
      })
      
      return NextResponse.json(
        { 
          success: false,
          error: '잘못된 결제 파라미터입니다.',
          details: parsed.error.issues,
          receivedParams: params
        },
        { status: 400 }
      )
    }

    const { amount, orderId, orderName, customerName, customerEmail, successUrl, failUrl } = parsed.data

    // 토스페이먼츠 결제창 URL 생성
    const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY
    
    console.log('환경 변수 확인:', {
      clientKey,
      envKeys: Object.keys(process.env).filter(key => key.includes('TOSS'))
    })
    
    if (!clientKey) {
      return NextResponse.json(
        { 
          success: false,
          error: '결제 시스템 설정이 올바르지 않습니다.',
          debug: {
            clientKey,
            allEnvKeys: Object.keys(process.env).filter(key => key.includes('TOSS'))
          }
        },
        { status: 500 }
      )
    }

    // 토스페이먼츠 결제창 HTML 생성 (테스트 환경)
    const paymentHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>토스페이먼츠 결제</title>
    <script src="https://js.tosspayments.com/v1/payment"></script>
</head>
<body>
    <div id="payment-button" style="padding: 20px; text-align: center;">
        <h2>결제 진행 중...</h2>
        <p>결제창을 불러오고 있습니다.</p>
    </div>
    
    <script>
        const clientKey = '${clientKey}';
        const tossPayments = TossPayments(clientKey);
        
        // 결제 요청
        tossPayments.requestPayment('카드', {
            amount: ${amount},
            orderId: '${orderId}',
            orderName: '${orderName}',
            customerName: '${customerName || ''}',
            customerEmail: '${customerEmail || ''}',
            successUrl: '${successUrl}',
            failUrl: '${failUrl}'
        }).catch(function(error) {
            if (error.code === 'USER_CANCEL') {
                alert('결제가 취소되었습니다.');
                window.location.href = '${failUrl}?error=USER_CANCEL';
            } else {
                alert('결제 중 오류가 발생했습니다: ' + error.message);
                window.location.href = '${failUrl}?error=' + encodeURIComponent(error.message);
            }
        });
    </script>
</body>
</html>`;

    return new NextResponse(paymentHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('결제 리다이렉트 오류:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '결제 처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}
