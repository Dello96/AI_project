import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

/**
 * ⚠️ DEPRECATED: 커스텀 JWT 토큰 관리
 * 
 * Supabase 자동 토큰 관리 방식으로 통합되어 아래 JWT 관련 함수들은 더 이상 사용되지 않습니다.
 * 레이트 리밋과 감사 로그 기능만 활성화되어 있습니다.
 * 
 * 변경 사항:
 * - Supabase Auth의 autoRefreshToken: true 사용
 * - onAuthStateChange로 자동 세션 관리
 * - 커스텀 JWT 생성/검증 로직 제거
 */

// DEPRECATED: JWT 토큰 설정 (현재 사용되지 않음)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const ACCESS_TOKEN_EXPIRY = '15m' // 15분
const REFRESH_TOKEN_EXPIRY = '7d' // 7일

// 보안 설정
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_BLOCK_DURATION = 15 * 60 * 1000 // 15분 (밀리초)

// 로그인 시도 추적 (메모리 기반, 프로덕션에서는 Redis 사용 권장)
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>()

// DEPRECATED: 쿠키 설정 (현재 사용되지 않음, Supabase가 자동 관리)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 // 7일
}

/**
 * @deprecated Supabase Auth로 대체됨
 * JWT 토큰 생성 (간단한 구현, 프로덕션에서는 jose 라이브러리 사용 권장)
 */
export function createJWT(payload: any, expiresIn: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  
  let expiry: number
  if (expiresIn.endsWith('m')) {
    expiry = now + parseInt(expiresIn) * 60
  } else if (expiresIn.endsWith('h')) {
    expiry = now + parseInt(expiresIn) * 60 * 60
  } else if (expiresIn.endsWith('d')) {
    expiry = now + parseInt(expiresIn) * 24 * 60 * 60
  } else {
    expiry = now + parseInt(expiresIn)
  }
  
  const data = { ...payload, iat: now, exp: expiry }
  
  // Base64 인코딩 (실제로는 jose 라이브러리 사용)
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedData = Buffer.from(JSON.stringify(data)).toString('base64url')
  
  // 간단한 서명 (실제로는 HMAC 사용)
  const signature = createHash('sha256')
    .update(`${encodedHeader}.${encodedData}.${JWT_SECRET}`)
    .digest('base64url')
  
  return `${encodedHeader}.${encodedData}.${signature}`
}

/**
 * @deprecated Supabase Auth로 대체됨
 * JWT 토큰 검증
 */
export function verifyJWT(token: string): any {
  try {
    const [header, data, signature] = token.split('.')
    
    // 서명 검증
    const expectedSignature = createHash('sha256')
      .update(`${header}.${data}.${JWT_SECRET}`)
      .digest('base64url')
    
    if (signature !== expectedSignature || !data) {
      return null
    }
    
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    
    // 만료 확인
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    return payload
  } catch (error) {
    return null
  }
}

/**
 * @deprecated Supabase Auth로 대체됨
 * 리프레시 토큰 생성
 */
export function createRefreshToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * @deprecated Supabase Auth로 대체됨
 * 쿠키 설정
 */
export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string): NextResponse {
  response.cookies.set('access_token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 // 15분
  })
  
  response.cookies.set('refresh_token', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60, // 7일
    sameSite: 'strict' // 리프레시 토큰은 더 엄격한 설정
  })
  
  return response
}

/**
 * @deprecated Supabase Auth로 대체됨
 * 쿠키에서 토큰 가져오기
 */
export function getAuthCookies(request: NextRequest): { accessToken?: string; refreshToken?: string } {
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  
  return {
    ...(accessToken && { accessToken }),
    ...(refreshToken && { refreshToken })
  }
}

/**
 * @deprecated Supabase Auth로 대체됨
 * 쿠키 삭제
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete('access_token')
  response.cookies.delete('refresh_token')
  return response
}

// 레이트 리밋 체크
export function checkRateLimit(email: string): { allowed: boolean; remainingAttempts: number; blockedUntil?: number } {
  const now = Date.now()
  const attempts = loginAttempts.get(email)
  
  if (!attempts) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS }
  }
  
  // 차단 시간이 지났으면 초기화
  if (attempts.blockedUntil && now > attempts.blockedUntil) {
    loginAttempts.delete(email)
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS }
  }
  
  // 차단 중인 경우
  if (attempts.blockedUntil && now <= attempts.blockedUntil) {
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      blockedUntil: attempts.blockedUntil 
    }
  }
  
  // 시도 횟수 확인
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    // 차단 설정
    const blockedUntil = now + LOGIN_BLOCK_DURATION
    attempts.blockedUntil = blockedUntil
    loginAttempts.set(email, attempts)
    
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      blockedUntil 
    }
  }
  
  return { 
    allowed: true, 
    remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts.count 
  }
}

// 로그인 실패 기록
export function recordLoginFailure(email: string): void {
  const attempts = loginAttempts.get(email) || { count: 0, blockedUntil: 0 }
  attempts.count += 1
  loginAttempts.set(email, attempts)
}

// 로그인 성공 시 기록 초기화
export function resetLoginAttempts(email: string): void {
  loginAttempts.delete(email)
}

// 감사 로그 타입
export interface AuthAuditLog {
  id: string
  email: string
  action: 'login_success' | 'login_failure' | 'logout' | 'token_refresh'
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  details?: any
}

// 간단한 감사 로그 (메모리 기반, 프로덕션에서는 데이터베이스 사용)
const authAuditLogs: AuthAuditLog[] = []

// 감사 로그 기록
export function logAuthAction(log: Omit<AuthAuditLog, 'id' | 'timestamp'>): void {
  const auditLog: AuthAuditLog = {
    ...log,
    id: randomBytes(16).toString('hex'),
    timestamp: new Date()
  }
  
  authAuditLogs.push(auditLog)
  
  // 로그가 너무 많아지면 오래된 것부터 삭제 (최대 1000개 유지)
  if (authAuditLogs.length > 1000) {
    authAuditLogs.splice(0, authAuditLogs.length - 1000)
  }
  
  // 콘솔에 로그 출력 (개발용)
  if (process.env.NODE_ENV === 'development') {
  }
}

// 감사 로그 조회
export function getAuthAuditLogs(email?: string): AuthAuditLog[] {
  if (email) {
    return authAuditLogs.filter(log => log.email === email)
  }
  return [...authAuditLogs].reverse() // 최신 순으로 정렬
}
