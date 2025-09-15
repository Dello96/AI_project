#!/usr/bin/env node

/**
 * 교회 도메인 시드 데이터 추가 스크립트
 * 
 * 사용법:
 * 1. Supabase 프로젝트 설정 후
 * 2. node scripts/seed-church-domains.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.')
  console.error('   .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const churchDomains = [
  { domain: 'gracechurch', name: '은혜교회', description: '서울 강남구 소재 청년부' },
  { domain: 'newlife', name: '새생명교회', description: '서울 서초구 소재 청년부' },
  { domain: 'harvest', name: '추수교회', description: '서울 마포구 소재 청년부' },
  { domain: 'victory', name: '승리교회', description: '서울 송파구 소재 청년부' },
  { domain: 'peace', name: '평화교회', description: '서울 영등포구 소재 청년부' },
  { domain: 'hope', name: '소망교회', description: '서울 노원구 소재 청년부' },
  { domain: 'love', name: '사랑교회', description: '서울 강동구 소재 청년부' },
  { domain: 'faith', name: '믿음교회', description: '서울 도봉구 소재 청년부' },
  { domain: 'joy', name: '기쁨교회', description: '서울 중랑구 소재 청년부' },
  { domain: 'light', name: '빛교회', description: '서울 성북구 소재 청년부' }
]

async function seedChurchDomains() {
  try {
    console.log('🌱 교회 도메인 시드 데이터 추가 시작...')
    
    // 기존 데이터 확인
    const { data: existingDomains, error: checkError } = await supabase
      .from('church_domains')
      .select('domain')
    
    if (checkError) {
      console.error('❌ 기존 데이터 확인 실패:', checkError.message)
      return
    }
    
    const existingDomainNames = existingDomains?.map(d => d.domain) || []
    const newDomains = churchDomains.filter(d => !existingDomainNames.includes(d.domain))
    
    if (newDomains.length === 0) {
      console.log('✅ 모든 교회 도메인이 이미 존재합니다.')
      return
    }
    
    console.log(`📝 ${newDomains.length}개의 새로운 교회 도메인을 추가합니다...`)
    
    // 데이터 삽입
    const { data, error } = await supabase
      .from('church_domains')
      .insert(newDomains)
      .select()
    
    if (error) {
      console.error('❌ 교회 도메인 추가 실패:', error.message)
      return
    }
    
    console.log('✅ 교회 도메인 시드 데이터 추가 완료!')
    console.log('📋 추가된 교회 목록:')
    data.forEach(domain => {
      console.log(`   - ${domain.name} (@${domain.domain})`)
    })
    
    console.log('\n🎉 이제 회원가입에서 교회를 선택할 수 있습니다!')
    
  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error.message)
  }
}

// 스크립트 실행
seedChurchDomains()
