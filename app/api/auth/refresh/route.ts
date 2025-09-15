import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { 
  createJWT, 
  createRefreshToken, 
  setAuthCookies, 
  getAuthCookies,
  logAuthAction 
} from '@/lib/auth-tokens'

export async function POST(request: NextRequest) {
  // Supabase Auth가 자동으로 토큰 갱신을 처리하므로 이 API는 비활성화
  return NextResponse.json(
    { error: '토큰 갱신 API가 비활성화되었습니다. Supabase Auth를 사용하세요.' },
    { status: 410 } // Gone 상태 코드
  )
}
