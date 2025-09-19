import { createClient } from '@supabase/supabase-js'

// 개발 환경에서는 임시 값 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://temp.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'temp-key'

// 실제 환경 변수가 없을 때는 경고만 출력
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. 개발 모드로 실행됩니다.')
  console.warn('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '설정되지 않음')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false, // 토큰 자동 갱신 비활성화
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 서버 사이드 전용 클라이언트 (Service Role Key 사용)
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'temp-service-key'

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ Supabase Service Role Key가 설정되지 않았습니다.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
