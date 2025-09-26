#!/usr/bin/env node

/**
 * 카카오 OAuth 설정 확인 스크립트
 * Vercel 배포 전에 카카오 OAuth 설정을 확인합니다.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 카카오 OAuth 설정 확인 중...\n');

// 1. 환경 변수 확인
console.log('1. 환경 변수 확인:');
const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('❌ .env.local 파일을 찾을 수 없습니다.');
  process.exit(1);
}

const requiredEnvVars = [
  'KAKAO_CLIENT_ID',
  'KAKAO_CLIENT_SECRET', 
  'NEXT_PUBLIC_KAKAO_MAP_API_KEY',
  'NEXT_PUBLIC_SITE_URL'
];

let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (envContent.includes(varName)) {
    console.log(`✅ ${varName}: 설정됨`);
  } else {
    console.log(`❌ ${varName}: 누락됨`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('\n⚠️  누락된 환경 변수:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
}

// 2. 카카오 OAuth 코드 확인
console.log('\n2. 카카오 OAuth 코드 확인:');
const kakaoAuthPath = path.join(process.cwd(), 'app/api/auth/kakao/route.ts');
let kakaoAuthContent = '';

try {
  kakaoAuthContent = fs.readFileSync(kakaoAuthPath, 'utf8');
} catch (error) {
  console.log('❌ 카카오 OAuth 파일을 찾을 수 없습니다.');
  process.exit(1);
}

if (kakaoAuthContent.includes('process.env.NEXT_PUBLIC_SITE_URL')) {
  console.log('✅ 환경 변수 사용: NEXT_PUBLIC_SITE_URL');
} else {
  console.log('❌ 환경 변수 사용 안됨');
}

if (kakaoAuthContent.includes('console.log')) {
  console.log('✅ 디버깅 로그 포함됨');
} else {
  console.log('⚠️  디버깅 로그 없음');
}

// 3. Supabase 설정 확인
console.log('\n3. Supabase 설정 확인:');
const supabasePath = path.join(process.cwd(), 'lib/supabase.ts');
let supabaseContent = '';

try {
  supabaseContent = fs.readFileSync(supabasePath, 'utf8');
} catch (error) {
  console.log('❌ Supabase 설정 파일을 찾을 수 없습니다.');
  process.exit(1);
}

if (supabaseContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
  console.log('✅ Supabase URL 설정됨');
} else {
  console.log('❌ Supabase URL 설정 안됨');
}

if (supabaseContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
  console.log('✅ Supabase Anon Key 설정됨');
} else {
  console.log('❌ Supabase Anon Key 설정 안됨');
}

// 4. 체크리스트 출력
console.log('\n📋 카카오 개발자 콘솔 설정 체크리스트:');
console.log('1. [ ] 카카오 개발자 콘솔 접속: https://developers.kakao.com/');
console.log('2. [ ] 내 애플리케이션 > 앱 설정 > 플랫폼');
console.log('   - Web 플랫폼 추가: https://your-app-name.vercel.app');
console.log('3. [ ] 제품 설정 > 카카오 로그인');
console.log('   - Redirect URI 추가: https://your-app-name.vercel.app/auth/callback');
console.log('   - 동의항목 설정: 닉네임, 카카오계정(이메일)');
console.log('4. [ ] Vercel 환경 변수 설정');
console.log('   - NEXT_PUBLIC_SITE_URL: https://your-app-name.vercel.app');
console.log('5. [ ] Supabase Dashboard > Authentication > URL Configuration');
console.log('   - Site URL: https://your-app-name.vercel.app');
console.log('   - Redirect URLs: https://your-app-name.vercel.app/auth/callback');

// 5. Vercel 배포 명령어
console.log('\n🚀 Vercel 배포 명령어:');
console.log('vercel --prod');

console.log('\n✅ 설정 확인 완료!');
console.log('위 체크리스트를 모두 완료한 후 Vercel에 배포하세요.');
