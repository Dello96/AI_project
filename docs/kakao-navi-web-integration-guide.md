# 카카오 내비 웹 통합 가이드

## 🎯 개요

웹페이지에서 카카오 내비 앱 설치 없이 바로 길안내 기능을 사용할 수 있도록 웹 기반 카카오 내비 기능을 구현했습니다.

## ✨ 주요 개선사항

### **1. 웹 기반 길안내**
- **기능**: 카카오 내비 웹에서 실시간 길안내 시작
- **장점**: 앱 설치 불필요, 즉시 사용 가능
- **사용법**: "내비 길안내" 버튼 클릭 시 새 창에서 카카오 내비 웹 열림

### **2. 웹 기반 목적지 공유**
- **기능**: 카카오 내비 웹에서 목적지 정보 공유
- **장점**: 앱 설치 불필요, 즉시 사용 가능
- **사용법**: "목적지 공유" 버튼 클릭 시 새 창에서 카카오 내비 웹 열림

## 🔧 기술 구현

### **1. 웹 기반 URL 생성**
```typescript
// utils/kakaoMapUtils.ts
export function generateKakaoNaviWebUrl(
  locationData: LocationData,
  options: {
    vehicleType?: '1' | '2' | '3' | '4';
    rpOption?: '1' | '2' | '3' | '4' | '5';
    routeInfo?: boolean;
  } = {}
): string {
  const baseUrl = 'https://map.kakao.com/link/navi';
  const params = new URLSearchParams({
    name: locationData.name,
    x: locationData.lng.toString(),
    y: locationData.lat.toString(),
    coordType: 'wgs84',
    vehicleType,
    rpOption,
    routeInfo: routeInfo ? 'true' : 'false'
  });
  
  return `${baseUrl}?${params.toString()}`;
}
```

### **2. 웹 기반 길안내 시작**
```typescript
export function startKakaoNaviWeb(
  locationData: LocationData,
  options: {
    vehicleType?: '1' | '2' | '3' | '4';
    rpOption?: '1' | '2' | '3' | '4' | '5';
    routeInfo?: boolean;
  } = {}
): void {
  if (!isKakaoNaviWebAvailable()) {
    console.error('웹 기반 카카오 내비 기능을 사용할 수 없습니다.');
    return;
  }

  const naviUrl = generateKakaoNaviWebUrl(locationData, options);
  
  // 새 창에서 카카오 내비 웹 길안내 열기
  window.open(naviUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
}
```

### **3. 웹 기반 목적지 공유**
```typescript
export function generateKakaoNaviShareUrl(locationData: LocationData): string {
  const baseUrl = 'https://map.kakao.com/link/share';
  const params = new URLSearchParams({
    name: locationData.name,
    x: locationData.lng.toString(),
    y: locationData.lat.toString(),
    coordType: 'wgs84'
  });
  
  return `${baseUrl}?${params.toString()}`;
}
```

## 🎨 UI 구현

### **1. 즉시 사용 가능한 버튼**
```typescript
// EventDetail.tsx
{isKakaoNaviWebAvailable() && (
  <>
    <Button
      onClick={() => {
        startKakaoNaviWeb(event.locationData!, {
          vehicleType: '1', // 자동차
          rpOption: '1',    // 추천 경로
          routeInfo: true   // 경로 정보 표시
        });
      }}
      className="flex items-center gap-1 text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
    >
      <MapPinIcon className="w-3 h-3" />
      내비 길안내
    </Button>
    <Button
      onClick={() => {
        shareKakaoNaviWeb(event.locationData!);
      }}
      className="flex items-center gap-1 text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
    >
      <ArrowTopRightOnSquareIcon className="w-3 h-3" />
      목적지 공유
    </Button>
  </>
)}
```

### **2. 조건부 렌더링**
- **위치 정보 있음**: 내비 길안내 + 목적지 공유 버튼 표시
- **위치 정보 없음**: 안내 메시지 표시
- **웹 환경**: 즉시 사용 가능

## 📱 사용자 경험

### **1. 위치 정보가 있는 경우**
- ✅ **지도 보기**: 카카오맵에서 위치 확인
- ✅ **길찾기**: 카카오맵에서 길찾기
- ✅ **내비 길안내**: 카카오 내비 웹에서 실시간 길안내 (새 창)
- ✅ **목적지 공유**: 카카오 내비 웹에서 목적지 공유 (새 창)

### **2. 위치 정보가 없는 경우**
- ✅ **지도에서 검색**: 장소명으로 카카오맵 검색
- ✅ **길찾기**: 장소명으로 카카오맵 길찾기
- ⚠️ **내비 기능 제한**: 정확한 위치 정보 필요 안내

## 🔄 동작 흐름

### **1. 버튼 클릭**
```typescript
const handleNaviStart = () => {
  startKakaoNaviWeb(event.locationData!, {
    vehicleType: '1', // 자동차
    rpOption: '1',    // 추천 경로
    routeInfo: true   // 경로 정보 표시
  });
}
```

### **2. URL 생성**
```typescript
// 생성되는 URL 예시
https://map.kakao.com/link/navi?name=강남역&x=127.0276&y=37.4979&coordType=wgs84&vehicleType=1&rpOption=1&routeInfo=true
```

### **3. 새 창 열기**
```typescript
window.open(naviUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
```

## ⚙️ 설정 옵션

### **1. 차량 종류 (vehicleType)**
- `'1'`: 자동차 (기본값)
- `'2'`: 승용차
- `'3'`: 화물차
- `'4'`: 대형차

### **2. 경로 옵션 (rpOption)**
- `'1'`: 추천 경로 (기본값)
- `'2'`: 최단 경로
- `'3'`: 무료 도로 우선
- `'4'`: 고속 도로 우선
- `'5'`: 일반 도로 우선

### **3. 경로 정보 (routeInfo)**
- `true`: 경로 정보 표시 (기본값)
- `false`: 경로 정보 숨김

## 🚨 주의사항

### **1. 웹 환경 필수**
- 브라우저에서만 작동
- `window.open` 함수 사용

### **2. 팝업 차단 설정**
- 브라우저 팝업 차단 설정 확인 필요
- 사용자가 팝업을 허용해야 함

### **3. 정확한 위치 정보 필요**
- `locationData` (위도, 경도)가 있어야 내비 기능 사용 가능
- 장소명만 있는 경우 내비 기능 제한

## 🔍 디버깅

### **1. 웹 기능 사용 가능 여부 확인**
```typescript
const isAvailable = isKakaoNaviWebAvailable();
console.log('웹 내비 기능 사용 가능:', isAvailable);
```

### **2. URL 생성 확인**
```typescript
const url = generateKakaoNaviWebUrl(locationData, options);
console.log('생성된 내비 URL:', url);
```

### **3. 오류 처리**
```typescript
try {
  startKakaoNaviWeb(locationData);
} catch (error) {
  console.error('카카오 내비 웹 길 안내 오류:', error);
}
```

## 📊 성능 최적화

### **1. 즉시 사용 가능**
- 앱 설치 불필요
- API 로드 대기 시간 없음
- 즉시 버튼 클릭 가능

### **2. 메모리 효율성**
- 별도 SDK 로드 불필요
- 가벼운 URL 생성 방식
- 브라우저 네이티브 기능 활용

### **3. 사용자 경험**
- 빠른 응답 시간
- 직관적인 인터페이스
- 명확한 피드백

## 🎯 주요 장점

### **1. 앱 설치 불필요**
- 카카오 내비 앱 설치 없이 사용 가능
- 웹 브라우저에서 바로 작동

### **2. 즉시 사용 가능**
- 로딩 시간 없음
- API 초기화 불필요
- 버튼 클릭 즉시 실행

### **3. 크로스 플랫폼**
- 데스크톱, 모바일 모든 환경에서 사용 가능
- 브라우저만 있으면 어디서나 사용

### **4. 유지보수 용이**
- 복잡한 SDK 관리 불필요
- URL 기반 간단한 구현
- 오류 발생 가능성 낮음

## 🔄 기존 대비 개선사항

### **Before (앱 기반)**
- ❌ 카카오 내비 앱 설치 필요
- ❌ API 로드 대기 시간
- ❌ 앱이 없으면 설치 페이지로 이동
- ❌ 복잡한 초기화 과정

### **After (웹 기반)**
- ✅ 앱 설치 불필요
- ✅ 즉시 사용 가능
- ✅ 웹에서 바로 길안내
- ✅ 간단한 URL 기반 구현

## 🚀 사용 방법

### **1. 일정 상세 모달 열기**
- 캘린더에서 일정 클릭
- 일정 상세 모달이 열림

### **2. 내비 길안내 시작**
- "내비 길안내" 버튼 클릭
- 새 창에서 카카오 내비 웹 열림
- 실시간 길안내 시작

### **3. 목적지 공유**
- "목적지 공유" 버튼 클릭
- 새 창에서 카카오 내비 웹 열림
- 목적지 정보 공유 가능

---

**구현 완료일**: 2024년 12월 26일  
**버전**: 2.0.0 (웹 기반)  
**참고 문서**: [카카오 내비 JavaScript SDK](https://developers.kakao.com/docs/latest/ko/kakaonavi/js)
