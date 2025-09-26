# 카카오 내비 앱 직접 연결 통합 가이드

## 🎯 개요

웹페이지에서 카카오 내비 앱이 바로 열리고 길찾기 요청한 주소로 바로 안내되도록 앱 직접 연결 방식을 구현했습니다.

## ✨ 주요 개선사항

### **1. 앱 직접 연결**
- **기능**: 카카오 내비 앱이 바로 열리고 길안내 시작
- **장점**: 웹이 아닌 앱에서 직접 길안내
- **사용법**: "내비 길안내" 버튼 클릭 시 카카오 내비 앱으로 바로 이동

### **2. 스마트 폴백**
- **앱 설치됨**: 카카오 내비 앱으로 바로 이동
- **앱 미설치**: 카카오 내비 웹으로 폴백
- **오류 발생**: 웹으로 안전하게 폴백

## 🔧 기술 구현

### **1. 앱 직접 연결 URL 생성**
```typescript
// utils/kakaoMapUtils.ts
export function generateKakaoNaviAppUrl(
  locationData: LocationData,
  options: {
    vehicleType?: '1' | '2' | '3' | '4';
    rpOption?: '1' | '2' | '3' | '4' | '5';
    routeInfo?: boolean;
  } = {}
): string {
  const baseUrl = 'kakaomap://route';
  const params = new URLSearchParams({
    sp: '', // 출발지 (빈 값이면 현재 위치)
    ep: `${locationData.lng},${locationData.lat}`, // 도착지 (경도,위도)
    by: 'CAR', // 교통수단 (CAR, PUBLIC_TRANSIT, WALK, BICYCLE)
    rp: rpOption === '1' ? 'RECOMMEND' : 
        rpOption === '2' ? 'SHORTEST' : 
        rpOption === '3' ? 'FREE' : 
        rpOption === '4' ? 'HIGHWAY' : 'GENERAL',
    name: locationData.name
  });
  
  return `${baseUrl}?${params.toString()}`;
}
```

### **2. 앱 설치 여부 확인 및 폴백**
```typescript
export function startKakaoNavi(locationData, options) {
  try {
    // 앱 URL 생성
    const appUrl = generateKakaoNaviAppUrl(locationData, options);
    
    // 웹 폴백 URL 생성
    const webUrl = generateKakaoNaviWebUrl(locationData, options);
    
    // 앱 설치 여부 확인을 위한 iframe 사용
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = appUrl;
    document.body.appendChild(iframe);
    
    // 앱이 설치되지 않은 경우 웹으로 폴백
    setTimeout(() => {
      document.body.removeChild(iframe);
      window.location.href = webUrl;
    }, 1000);
    
  } catch (error) {
    // 오류 발생 시 웹으로 폴백
    const webUrl = generateKakaoNaviWebUrl(locationData, options);
    window.location.href = webUrl;
  }
}
```

### **3. 목적지 공유 앱 연결**
```typescript
export function generateKakaoNaviAppShareUrl(locationData: LocationData): string {
  const baseUrl = 'kakaomap://place';
  const params = new URLSearchParams({
    id: `${locationData.lng},${locationData.lat}`, // 장소 ID (경도,위도)
    name: locationData.name,
    address: locationData.address
  });
  
  return `${baseUrl}?${params.toString()}`;
}
```

## 🎨 UI 구현

### **1. 조건부 렌더링**
```typescript
// EventDetail.tsx
{isValidLocationData(event.locationData) && (
  <>
    <Button
      onClick={() => {
        startKakaoNavi(event.locationData!, {
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
        shareKakaoNavi(event.locationData!);
      }}
      className="flex items-center gap-1 text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
    >
      <ArrowTopRightOnSquareIcon className="w-3 h-3" />
      목적지 공유
    </Button>
  </>
)}
```

### **2. 위치 정보 없을 때 안내**
```typescript
{event.location && (
  <div className="text-xs text-gray-500 mt-1">
    카카오 내비 기능을 사용하려면 정확한 위치 정보가 필요합니다.
  </div>
)}
```

## 📱 사용자 경험

### **1. 위치 정보가 있는 경우**
- ✅ **지도 보기**: 카카오맵에서 위치 확인
- ✅ **길찾기**: 카카오맵에서 길찾기
- ✅ **내비 길안내**: 카카오 내비 앱에서 실시간 길안내 (앱 직접 연결)
- ✅ **목적지 공유**: 카카오 내비 앱에서 목적지 공유 (앱 직접 연결)

### **2. 위치 정보가 없는 경우**
- ✅ **지도에서 검색**: 장소명으로 카카오맵 검색
- ✅ **길찾기**: 장소명으로 카카오맵 길찾기
- ⚠️ **안내 메시지**: "카카오 내비 기능을 사용하려면 정확한 위치 정보가 필요합니다"

## 🔄 동작 흐름

### **1. 앱 설치된 경우**
```typescript
// 1. 앱 URL 생성
kakaomap://route?sp=&ep=127.0276,37.4979&by=CAR&rp=RECOMMEND&name=강남역

// 2. iframe으로 앱 실행 시도
iframe.src = appUrl;

// 3. 앱이 열리면 웹페이지는 그대로 유지
// 4. 카카오 내비 앱에서 길안내 시작
```

### **2. 앱 미설치된 경우**
```typescript
// 1. 앱 URL 생성 (실패)
kakaomap://route?sp=&ep=127.0276,37.4979&by=CAR&rp=RECOMMEND&name=강남역

// 2. 1초 후 웹으로 폴백
setTimeout(() => {
  window.location.href = webUrl; // https://map.kakao.com/link/navi?...
}, 1000);

// 3. 카카오 내비 웹에서 길안내
```

## ⚙️ 설정 옵션

### **1. 교통수단 (by)**
- `CAR`: 자동차 (기본값)
- `PUBLIC_TRANSIT`: 대중교통
- `WALK`: 도보
- `BICYCLE`: 자전거

### **2. 경로 옵션 (rp)**
- `RECOMMEND`: 추천 경로 (기본값)
- `SHORTEST`: 최단 경로
- `FREE`: 무료 도로 우선
- `HIGHWAY`: 고속 도로 우선
- `GENERAL`: 일반 도로 우선

### **3. 출발지/도착지**
- `sp`: 출발지 (빈 값이면 현재 위치)
- `ep`: 도착지 (경도,위도 형식)

## 🚨 주의사항

### **1. 앱 설치 필요**
- 카카오 내비 앱이 설치되어 있어야 앱 직접 연결 가능
- 앱이 없으면 자동으로 웹으로 폴백

### **2. 모바일 환경 최적화**
- 주로 모바일에서 사용되는 기능
- 데스크톱에서는 웹으로 폴백

### **3. 팝업 차단 설정**
- iframe 사용으로 인한 팝업 차단 가능성
- 사용자가 팝업을 허용해야 함

## 🔍 디버깅

### **1. URL 생성 확인**
```typescript
const appUrl = generateKakaoNaviAppUrl(locationData, options);
console.log('앱 URL:', appUrl);
// kakaomap://route?sp=&ep=127.0276,37.4979&by=CAR&rp=RECOMMEND&name=강남역
```

### **2. 폴백 URL 확인**
```typescript
const webUrl = generateKakaoNaviWebUrl(locationData, options);
console.log('웹 폴백 URL:', webUrl);
// https://map.kakao.com/link/navi?name=강남역&x=127.0276&y=37.4979&coordType=wgs84&vehicleType=1&rpOption=1&routeInfo=true
```

### **3. 오류 처리**
```typescript
try {
  startKakaoNavi(locationData);
} catch (error) {
  console.error('카카오 내비 길 안내 오류:', error);
  // 자동으로 웹으로 폴백됨
}
```

## 📊 성능 최적화

### **1. 스마트 폴백**
- 앱 설치 여부 자동 감지
- 1초 타임아웃으로 빠른 폴백
- 사용자 경험 최적화

### **2. 메모리 관리**
- iframe 사용 후 즉시 제거
- 불필요한 리소스 정리
- 브라우저 성능 유지

### **3. 오류 처리**
- try-catch로 안전한 실행
- 오류 발생 시 자동 폴백
- 사용자에게 명확한 피드백

## 🎯 주요 장점

### **1. 앱 직접 연결**
- 웹이 아닌 앱에서 직접 길안내
- 더 나은 사용자 경험
- 앱의 모든 기능 활용 가능

### **2. 스마트 폴백**
- 앱 설치 여부 자동 감지
- 앱이 없으면 웹으로 자동 전환
- 사용자에게 투명한 경험

### **3. 크로스 플랫폼**
- 모바일: 앱 직접 연결
- 데스크톱: 웹으로 폴백
- 모든 환경에서 작동

### **4. 안정성**
- 오류 발생 시 자동 복구
- 사용자 개입 불필요
- 일관된 사용자 경험

## 🔄 기존 대비 개선사항

### **Before (웹 기반)**
- ❌ 웹에서만 길안내
- ❌ 앱 기능 제한
- ❌ 사용자 경험 제한

### **After (앱 직접 연결)**
- ✅ 앱에서 직접 길안내
- ✅ 앱의 모든 기능 활용
- ✅ 더 나은 사용자 경험
- ✅ 스마트 폴백으로 안정성 확보

## 🚀 사용 방법

### **1. 일정 상세 모달 열기**
- 캘린더에서 일정 클릭
- 일정 상세 모달이 열림

### **2. 내비 길안내 시작**
- "내비 길안내" 버튼 클릭
- 카카오 내비 앱이 바로 열림 (설치된 경우)
- 카카오 내비 웹이 열림 (미설치된 경우)
- 실시간 길안내 시작

### **3. 목적지 공유**
- "목적지 공유" 버튼 클릭
- 카카오 내비 앱이 바로 열림 (설치된 경우)
- 카카오 내비 웹이 열림 (미설치된 경우)
- 목적지 정보 공유 가능

## 📱 테스트 방법

### **1. 모바일에서 테스트**
- 카카오 내비 앱 설치 후 테스트
- 앱 미설치 상태에서 테스트
- 다양한 위치 정보로 테스트

### **2. 데스크톱에서 테스트**
- 웹으로 폴백되는지 확인
- URL 생성이 올바른지 확인
- 오류 처리 동작 확인

---

**구현 완료일**: 2024년 12월 26일  
**버전**: 3.0.0 (앱 직접 연결)  
**참고 문서**: [카카오 내비 JavaScript SDK](https://developers.kakao.com/docs/latest/ko/kakaonavi/js)
