# 일정 상세 모달 카카오맵 연동 가이드

## 📋 개요

일정 등록 시 카카오맵으로 검색한 장소 정보를 저장하고, 일정 상세 모달에서 해당 장소를 카카오맵으로 바로 연결하여 볼 수 있는 기능을 구현했습니다.

## 🚀 주요 기능

### 1. 장소 정보 저장
- **위치 검색**: 카카오맵 API를 통한 장소 검색
- **상세 정보 저장**: 장소명, 주소, 위도, 경도 정보를 JSON 형태로 저장
- **기존 호환성**: 기존 `location` 필드와 새로운 `locationData` 필드 병행 지원

### 2. 일정 상세 모달에서 카카오맵 연결
- **지도 보기**: 저장된 장소를 카카오맵에서 바로 확인
- **길찾기**: 현재 위치에서 목적지까지의 길찾기 제공
- **새 탭 열기**: 카카오맵을 새 탭에서 열어 사용자 경험 향상

## 🛠 기술 구현

### 1. 데이터 구조 확장

#### Event 타입 업데이트
```typescript
export interface Event {
  // ... 기존 필드들
  location?: string;  // 기존 텍스트 장소 정보
  locationData?: {    // 새로운 상세 장소 정보
    name: string;     // 장소명
    address: string;  // 주소
    lat: number;      // 위도
    lng: number;      // 경도
  };
}
```

### 2. 카카오맵 유틸리티 함수

#### 주요 함수들
```typescript
// 카카오맵 URL 생성
generateKakaoMapUrl(locationData, options)

// 길찾기 URL 생성
generateKakaoMapDirectionsUrl(locationData, options)

// 장소 검색 URL 생성
generateKakaoMapSearchUrl(query, options)

// 장소 정보 유효성 검사
isValidLocationData(locationData)
```

#### 사용 예시
```typescript
import { generateKakaoMapUrl, generateKakaoMapDirectionsUrl } from '@/utils/kakaoMapUtils'

// 지도 보기 URL 생성
const mapUrl = generateKakaoMapUrl(locationData, {
  zoom: 3,
  showMarker: true,
  showLabel: true
})

// 길찾기 URL 생성
const directionsUrl = generateKakaoMapDirectionsUrl(locationData, {
  transportType: 'car'
})
```

### 3. UI 컴포넌트 업데이트

#### EventDetail 컴포넌트
```tsx
{/* 장소 정보 표시 */}
{event.location && (
  <div className="flex items-start gap-3">
    <MapPinIcon className="w-5 h-5 text-secondary-400 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-secondary-600">장소</p>
      <p className="text-secondary-900">{event.location}</p>
      
      {/* 카카오맵 연결 버튼들 */}
      {isValidLocationData(event.locationData) && (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const mapUrl = generateKakaoMapUrl(event.locationData!, {
                zoom: 3,
                showMarker: true,
                showLabel: true
              });
              window.open(mapUrl, '_blank');
            }}
          >
            <MapPinIcon className="w-3 h-3" />
            지도 보기
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const directionsUrl = generateKakaoMapDirectionsUrl(event.locationData!, {
                transportType: 'car'
              });
              window.open(directionsUrl, '_blank');
            }}
          >
            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            길찾기
          </Button>
        </div>
      )}
    </div>
  </div>
)}
```

### 4. 데이터베이스 스키마

#### 새로운 컬럼 추가
```sql
-- events 테이블에 location_data 컬럼 추가
ALTER TABLE events 
ADD COLUMN location_data JSONB;

-- 성능 최적화를 위한 인덱스 생성
CREATE INDEX idx_events_location_data ON events USING GIN (location_data);
```

#### JSON 구조 예시
```json
{
  "name": "강남역",
  "address": "서울특별시 강남구 강남대로 396",
  "lat": 37.4979,
  "lng": 127.0276
}
```

## 📱 사용자 경험

### 1. 일정 등록 시
1. **장소 검색**: "지도에서 검색" 버튼 클릭
2. **장소 선택**: 검색 결과에서 원하는 장소 선택
3. **자동 저장**: 장소명, 주소, 위도/경도 정보가 자동으로 저장

### 2. 일정 상세 보기 시
1. **장소 정보 확인**: 저장된 장소명과 주소 표시
2. **지도 보기**: "지도 보기" 버튼으로 카카오맵에서 장소 확인
3. **길찾기**: "길찾기" 버튼으로 현재 위치에서 목적지까지 경로 안내

## 🔧 설정 및 배포

### 1. 데이터베이스 마이그레이션
```bash
# Supabase에서 SQL 스크립트 실행
psql -h your-db-host -U postgres -d your-db-name -f database/add_location_data_column.sql
```

### 2. 환경 변수 확인
```env
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_map_api_key
```

### 3. 빌드 및 배포
```bash
npm run build
npm run start
```

## 🎯 주요 장점

### 1. 사용자 편의성
- **원클릭 접근**: 일정 상세에서 바로 카카오맵 연결
- **정확한 위치**: 위도/경도 기반 정확한 장소 표시
- **길찾기 지원**: 현재 위치에서 목적지까지 자동 경로 안내

### 2. 개발자 편의성
- **재사용 가능한 유틸리티**: 다양한 카카오맵 URL 생성 함수
- **타입 안전성**: TypeScript로 장소 데이터 구조 보장
- **확장 가능성**: 추가 옵션과 기능 쉽게 확장 가능

### 3. 성능 최적화
- **JSONB 인덱스**: 장소 데이터 검색 성능 최적화
- **조건부 렌더링**: 장소 데이터가 있을 때만 버튼 표시
- **새 탭 열기**: 메인 앱 성능에 영향 없이 카카오맵 사용

## 🚨 주의사항

### 1. 데이터 호환성
- 기존 일정은 `location` 필드만 있고 `locationData`가 없을 수 있음
- `isValidLocationData()` 함수로 유효성 검사 필요

### 2. 카카오맵 API 제한
- 일일 요청 한도 확인 필요
- API 키 보안 관리 중요

### 3. 모바일 최적화
- 모바일에서 카카오맵 앱 연동 고려
- 반응형 디자인 적용

## 🔮 향후 개선 사항

### 1. 추가 기능
- **실시간 교통 정보**: 교통 상황 기반 경로 추천
- **대중교통 길찾기**: 대중교통 경로 안내
- **즐겨찾기**: 자주 가는 장소 저장

### 2. UI/UX 개선
- **인라인 지도**: 모달 내에서 미니 지도 표시
- **장소 사진**: 장소 관련 이미지 표시
- **리뷰 연동**: 장소 리뷰 정보 표시

### 3. 성능 최적화
- **지연 로딩**: 필요할 때만 카카오맵 API 로드
- **캐싱**: 자주 사용하는 장소 정보 캐싱
- **오프라인 지원**: 오프라인에서도 기본 장소 정보 표시

## 📞 지원

문제가 발생하거나 추가 기능이 필요한 경우, 개발팀에 문의해주세요.

---

**구현 완료일**: 2024년 12월 26일  
**버전**: 1.0.0  
**담당자**: 개발팀
