#!/usr/bin/env node

const dns = require('dns').promises;
const { URL } = require('url');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: '.env.local', quiet: true });

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const REQUIRED_TABLES = [
  'user_profiles',
  'posts',
  'comments',
  'events',
  'likes',
  'notifications',
];

const logSection = (title) => {
  console.log(`\n${title}`);
};

const getMissingEnvVars = () => {
  return REQUIRED_ENV_VARS.filter((name) => !process.env[name] || !process.env[name].trim());
};

const validateSupabaseUrl = (value) => {
  if (!value) return { ok: false, message: 'URL이 비어 있습니다.' };

  const normalized = value
    .trim()
    .replace(/^https?:\/\/https?:\/\//i, 'https://')
    .replace(/\/+$/, '');

  try {
    const parsed = new URL(normalized);
    if (!parsed.hostname.endsWith('.supabase.co')) {
      return { ok: false, message: 'Supabase 도메인(.supabase.co)이 아닙니다.' };
    }
    return { ok: true, normalized, hostname: parsed.hostname };
  } catch (error) {
    return { ok: false, message: `URL 형식 오류: ${error.message}` };
  }
};

const checkDns = async (hostname) => {
  try {
    await dns.lookup(hostname);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: `DNS 조회 실패: ${error.message}` };
  }
};

const checkTableAccess = async (client, tableName) => {
  const { error } = await client.from(tableName).select('id', { count: 'exact', head: true });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
};

const run = async () => {
  console.log('🔍 Supabase 연결 점검을 시작합니다.');

  const missingEnv = getMissingEnvVars();
  if (missingEnv.length > 0) {
    logSection('1) 환경 변수 점검');
    console.log('❌ 필수 환경 변수가 누락되었습니다.');
    missingEnv.forEach((name) => console.log(`   - ${name}`));
    process.exit(1);
  }

  const urlValidation = validateSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!urlValidation.ok) {
    logSection('1) 환경 변수 점검');
    console.log(`❌ NEXT_PUBLIC_SUPABASE_URL 오류: ${urlValidation.message}`);
    process.exit(1);
  }

  logSection('1) URL / DNS 점검');
  console.log(`✅ URL 형식 정상: ${urlValidation.normalized}`);

  const dnsCheck = await checkDns(urlValidation.hostname);
  if (!dnsCheck.ok) {
    console.log(`❌ ${dnsCheck.message}`);
    console.log('   - 프로젝트가 삭제되었거나 ref가 잘못되었을 수 있습니다.');
    process.exit(2);
  }
  console.log(`✅ DNS 조회 성공: ${urlValidation.hostname}`);

  logSection('2) Anon Key 연결 점검');
  const anonClient = createClient(urlValidation.normalized, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const anonResult = await checkTableAccess(anonClient, 'user_profiles');
  if (!anonResult.ok) {
    console.log(`❌ anon key 조회 실패: ${anonResult.message}`);
    console.log('   - 키가 잘못되었거나 RLS 정책/테이블 상태를 확인해주세요.');
    process.exit(3);
  }
  console.log('✅ anon key로 기본 조회 성공 (user_profiles)');

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || !serviceRoleKey.trim()) {
    logSection('3) Service Role 점검');
    console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY가 없어 서버 전용 검사는 건너뜁니다.');
    console.log('   - 댓글/알림/관리자 API는 service role key가 필요합니다.');
    process.exit(0);
  }

  logSection('3) Service Role 테이블 점검');
  const serviceClient = createClient(urlValidation.normalized, serviceRoleKey);

  let hasTableError = false;
  for (const tableName of REQUIRED_TABLES) {
    const result = await checkTableAccess(serviceClient, tableName);
    if (!result.ok) {
      hasTableError = true;
      console.log(`❌ ${tableName}: ${result.message}`);
    } else {
      console.log(`✅ ${tableName}: 접근 가능`);
    }
  }

  if (hasTableError) {
    console.log('\n⚠️ 일부 테이블 접근에 실패했습니다.');
    console.log('   - `database/schema.sql` 및 개별 SQL 파일을 Supabase SQL Editor에서 순서대로 반영하세요.');
    process.exit(4);
  }

  console.log('\n🎉 Supabase 연결 및 핵심 테이블 점검이 모두 정상입니다.');
};

run().catch((error) => {
  console.error('\n❌ 점검 중 예외가 발생했습니다.');
  console.error(error.message);
  process.exit(99);
});
