# 카카오 내비 API 통합 가이드

## 🎯 개요

[카카오 내비 JavaScript SDK](https://developers.kakao.com/docs/latest/ko/kakaonavi/js)를 활용하여 일정 상세 모달에서 바로 내비게이션 길안내 기능을 제공합니다.

## ✨ 주요 기능

### **1. 내비 길안내**
- **기능**: 카카오 내비 앱에서 실시간 길안내 시작
- **사용법**: "내비 길안내" 버튼 클릭
- **옵션**: 차량 종류, 경로 옵션, 경로 정보 표시

### **2. 목적지 공유**
- **기능**: 카카오 내비 앱에서 목적지 정보 공유
- **사용법**: "목적지 공유" 버튼 클릭
- **용도**: 다른 사용자와 목적지 공유

## 🔧 기술 구현

### **1. 카카오 내비 SDK 로드**
```html
<!-- app/layout.tsx -->
<Script
  src="//developers.kakao.com/sdk/js/kakao.js"
  strategy="beforeInteractive"
/>
```

### **2. 유틸리티 함수**
```typescript
// utils/kakaoMapUtils.ts
export function startKakaoNavi(
  locationData: LocationData,
  options: {
    vehicleType?: '1' | '2' | '3' | '4'; // 1:자동차, 2:승용차, 3:화물차, 4:대형차
    rpOption?: '1' | '2' | '3' | '4' | '5'; // 1:추천, 2:최단, 3:무료, 4:고속, 5:일반
    routeInfo?: boolean; // 경로 정보 표시 여부
  } = {}
): void

export function shareKakaoNavi(locationData: LocationData): void
```

### **3. API 초기화**
```typescript
// utils/kakaoNaviInit.ts
export function initKakaoNavi(): void
export function waitForKakaoNaviInit(timeout: number = 10000): Promise<boolean>
```

## 🎨 UI 구현

### **1. 버튼 디자인**
```typescript
// 카카오 내비 전용 버튼 스타일
className="flex items-center gap-1 text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
```

### **2. 조건부 렌더링**
```typescript
{isKakaoNaviReady && (
  <>
    <Button onClick={() => startKakaoNavi(event.locationData!)}>
      내비 길안내
    </Button>
    <Button onClick={() => shareKakaoNavi(event.locationData!)}>
      목적지 공유
    </Button>
  </>
)}
```

## 📱 사용자 경험

### **1. 위치 정보가 있는 경우**
- ✅ **지도 보기**: 카카오맵에서 위치 확인
- ✅ **길찾기**: 카카오맵에서 길찾기
- ✅ **내비 길안내**: 카카오 내비 앱에서 실시간 길안내
- ✅ **목적지 공유**: 카카오 내비 앱에서 목적지 공유

### **2. 위치 정보가 없는 경우**
- ✅ **지도에서 검색**: 장소명으로 카카오맵 검색
- ✅ **길찾기**: 장소명으로 카카오맵 길찾기
- ⚠️ **내비 기능 제한**: 정확한 위치 정보 필요 안내

## 🔄 동작 흐름

### **1. 모달 열기**
```typescript
useEffect(() => {
  const checkKakaoNavi = async () => {
    if (!isOpen) return
    
    // 카카오 내비 초기화
    initKakaoNavi()
    
    // API 로드 대기
    const isLoaded = await waitForKakaoNaviInit(5000)
    setIsKakaoNaviReady(isLoaded)
  }
  
  checkKakaoNavi()
}, [isOpen])
```

### **2. 길안내 시작**
```typescript
const handleNaviStart = () => {
  startKakaoNavi(event.locationData!, {
    vehicleType: '1', // 자동차
    rpOption: '1',    // 추천 경로
    routeInfo: true   // 경로 정보 표시
  });
}
```

### **3. 목적지 공유**
```typescript
const handleNaviShare = () => {
  shareKakaoNavi(event.locationData!);
}
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

### **1. 카카오 내비 앱 설치 필요**
- 카카오 내비 앱이 설치되어 있어야 길안내 기능 사용 가능
- 앱이 설치되지 않은 경우 설치 페이지로 이동

### **2. 정확한 위치 정보 필요**
- `locationData` (위도, 경도)가 있어야 내비 기능 사용 가능
- 장소명만 있는 경우 내비 기능 제한

### **3. 모바일 환경 최적화**
- 주로 모바일에서 사용되는 기능
- 데스크톱에서는 카카오맵 웹 버전 사용 권장

## 🔍 디버깅

### **1. API 로드 상태 확인**
```typescript
const status = checkKakaoNaviStatus();
console.log('카카오 내비 상태:', status);
// { isKakaoLoaded: true, isKakaoInitialized: true, isNaviAvailable: true }
```

### **2. 오류 처리**
```typescript
try {
  startKakaoNavi(locationData);
} catch (error) {
  console.error('카카오 내비 길 안내 오류:', error);
}
```

## 📊 성능 최적화

### **1. 지연 로딩**
- 모달이 열릴 때만 카카오 내비 API 로드
- 5초 타임아웃으로 로딩 제한

### **2. 상태 관리**
- `isKakaoNaviReady` 상태로 버튼 표시 제어
- API 로드 완료 후에만 내비 기능 활성화

### **3. 메모리 관리**
- 모달이 닫힐 때 불필요한 리소스 정리
- 이벤트 리스너 정리

## 🎯 향후 개선사항

### **1. 추가 옵션**
- 출발지 설정 기능
- 경유지 설정 기능
- 교통 정보 표시

### **2. 사용자 설정**
- 기본 차량 종류 설정
- 기본 경로 옵션 설정
- 내비 앱 선택 (카카오 내비 외 다른 앱)

### **3. 통계 및 분석**
- 내비 기능 사용 통계
- 사용자 행동 분석
- 성능 모니터링

---

**구현 완료일**: 2024년 12월 26일  
**버전**: 1.0.0  
**참고 문서**: [카카오 내비 JavaScript SDK](https://developers.kakao.com/docs/latest/ko/kakaonavi/js)
