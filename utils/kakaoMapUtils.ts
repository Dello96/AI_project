/**
 * 카카오맵 및 카카오 내비 관련 유틸리티 함수들
 */

export interface LocationData {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

// 카카오 내비 API 타입 정의
declare global {
  interface Window {
    Kakao: {
      Navi: {
        start: (options: {
          name: string;
          x: number;
          y: number;
          coordType?: 'wgs84' | 'katec';
          vehicleType?: '1' | '2' | '3' | '4';
          rpOption?: '1' | '2' | '3' | '4' | '5';
          routeInfo?: boolean;
        }) => void;
        share: (options: {
          name: string;
          x: number;
          y: number;
          coordType?: 'wgs84' | 'katec';
        }) => void;
      };
    };
  }
}

/**
 * 카카오맵 URL을 생성합니다
 * @param locationData 장소 정보 (이름, 주소, 위도, 경도)
 * @param options 추가 옵션
 * @returns 카카오맵 URL
 */
export function generateKakaoMapUrl(
  locationData: LocationData,
  options: {
    zoom?: number;
    mapType?: 'roadmap' | 'satellite' | 'hybrid';
    showMarker?: boolean;
    showLabel?: boolean;
  } = {}
): string {
  const {
    zoom = 3,
    mapType = 'roadmap',
    showMarker = true,
    showLabel = true
  } = options;

  const { name, address, lat, lng } = locationData;

  // 카카오맵 URL 생성
  let url = `https://map.kakao.com/link/map/${name}/${lat},${lng}`;
  
  // 추가 파라미터 추가
  const params = new URLSearchParams();
  
  if (zoom !== 3) {
    params.append('level', zoom.toString());
  }
  
  if (mapType !== 'roadmap') {
    params.append('maptype', mapType);
  }
  
  if (showMarker) {
    params.append('marker', '1');
  }
  
  if (showLabel) {
    params.append('label', '1');
  }

  // 주소 정보 추가
  if (address) {
    params.append('address', address);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  return url;
}

/**
 * 카카오내비 길찾기 URL을 생성합니다 (카카오맵 대신 카카오내비 사용)
 * @param locationData 목적지 장소 정보
 * @param options 추가 옵션
 * @returns 카카오내비 길찾기 URL
 */
export function generateKakaoMapDirectionsUrl(
  locationData: LocationData,
  options: {
    startAddress?: string;
    transportType?: 'car' | 'public' | 'walk' | 'bike';
  } = {}
): string {
  const { name, address, lat, lng } = locationData;
  const { startAddress, transportType = 'car' } = options;

  // 카카오내비 앱 URL만 반환 (올바른 형식 사용)
  return `kakaonavi://navigate?name=${encodeURIComponent(name)}&x=${lng}&y=${lat}&coord_type=wgs84`;
}

/**
 * 카카오맵 검색 URL을 생성합니다
 * @param query 검색어
 * @param options 추가 옵션
 * @returns 카카오맵 검색 URL
 */
export function generateKakaoMapSearchUrl(
  query: string,
  options: {
    category?: string;
    area?: string;
  } = {}
): string {
  const { category, area } = options;
  
  let url = `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
  
  const params = new URLSearchParams();
  
  if (category) {
    params.append('category', category);
  }
  
  if (area) {
    params.append('area', area);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  return url;
}

/**
 * 장소 정보를 카카오맵에서 검색할 수 있는 URL로 변환합니다
 * @param locationData 장소 정보
 * @returns 카카오맵 검색 URL
 */
export function generateKakaoMapSearchByLocationUrl(locationData: LocationData): string {
  return generateKakaoMapSearchUrl(locationData.name);
}

/**
 * 현재 위치에서 목적지까지의 길찾기 URL을 생성합니다
 * @param locationData 목적지 장소 정보
 * @returns 길찾기 URL
 */
export function generateDirectionsFromCurrentLocation(locationData: LocationData): string {
  return generateKakaoMapDirectionsUrl(locationData, {
    transportType: 'car'
  });
}

/**
 * 장소 정보가 유효한지 확인합니다
 * @param locationData 장소 정보
 * @returns 유효성 여부
 */
export function isValidLocationData(locationData: any): locationData is LocationData {
  return (
    locationData &&
    typeof locationData === 'object' &&
    typeof locationData.name === 'string' &&
    typeof locationData.address === 'string' &&
    typeof locationData.lat === 'number' &&
    typeof locationData.lng === 'number' &&
    !isNaN(locationData.lat) &&
    !isNaN(locationData.lng) &&
    locationData.lat >= -90 &&
    locationData.lat <= 90 &&
    locationData.lng >= -180 &&
    locationData.lng <= 180
  );
}

/**
 * 장소 정보를 문자열로 포맷팅합니다
 * @param locationData 장소 정보
 * @returns 포맷된 문자열
 */
export function formatLocationString(locationData: LocationData): string {
  return `${locationData.name} (${locationData.address})`;
}

/**
 * 카카오 내비 앱으로 길 안내를 시작합니다 (앱 직접 연결)
 * @param locationData 목적지 장소 정보
 * @param options 길 안내 옵션
 */
export function startKakaoNavi(
  locationData: LocationData,
  options: {
    vehicleType?: '1' | '2' | '3' | '4'; // 1:자동차, 2:승용차, 3:화물차, 4:대형차
    rpOption?: '1' | '2' | '3' | '4' | '5'; // 1:추천, 2:최단, 3:무료, 4:고속, 5:일반
    routeInfo?: boolean; // 경로 정보 표시 여부
  } = {}
): void {
  if (typeof window === 'undefined') {
    console.error('브라우저 환경이 아닙니다.');
    return;
  }

  const { vehicleType = '1', rpOption = '1', routeInfo = true } = options;

  try {
    // 카카오내비 앱 직접 연결 URL 생성 (올바른 형식 사용)
    const appUrl = `kakaonavi://navigate?name=${encodeURIComponent(locationData.name)}&x=${locationData.lng}&y=${locationData.lat}&coord_type=wgs84`;
    
    // 카카오내비 앱으로만 직접 이동 (웹 폴백 없음)
    window.location.href = appUrl;
    
  } catch (error) {
    console.error('카카오 내비 길 안내 시작 오류:', error);
    // 오류 발생 시에도 앱으로만 시도
    const appUrl = `kakaonavi://navigate?name=${encodeURIComponent(locationData.name)}&x=${locationData.lng}&y=${locationData.lat}&coord_type=wgs84`;
    window.location.href = appUrl;
  }
}

/**
 * 카카오 내비 앱 직접 연결 URL을 생성합니다
 * @param locationData 목적지 장소 정보
 * @param options 길 안내 옵션
 * @returns 카카오 내비 앱 URL
 */
export function generateKakaoNaviAppUrl(
  locationData: LocationData,
  options: {
    vehicleType?: '1' | '2' | '3' | '4';
    rpOption?: '1' | '2' | '3' | '4' | '5';
    routeInfo?: boolean;
  } = {}
): string {
  const { vehicleType = '1', rpOption = '1', routeInfo = true } = options;
  
  // 카카오 내비 앱 직접 연결 URL 형식
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

/**
 * 카카오 내비 앱 목적지 공유 URL을 생성합니다
 * @param locationData 목적지 장소 정보
 * @returns 카카오 내비 앱 공유 URL
 */
export function generateKakaoNaviAppShareUrl(locationData: LocationData): string {
  // 카카오 내비 앱 목적지 공유 URL 형식
  const baseUrl = 'kakaomap://place';
  const params = new URLSearchParams({
    id: `${locationData.lng},${locationData.lat}`, // 장소 ID (경도,위도)
    name: locationData.name,
    address: locationData.address
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * 카카오 내비 웹 길안내 URL을 생성합니다
 * @param locationData 목적지 장소 정보
 * @param options 길 안내 옵션
 * @returns 카카오 내비 웹 URL
 */
export function generateKakaoNaviWebUrl(
  locationData: LocationData,
  options: {
    vehicleType?: '1' | '2' | '3' | '4';
    rpOption?: '1' | '2' | '3' | '4' | '5';
    routeInfo?: boolean;
  } = {}
): string {
  const { vehicleType = '1', rpOption = '1', routeInfo = true } = options;
  
  // 카카오 내비 웹 길안내 URL 형식
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

/**
 * 카카오 내비 앱으로 목적지를 공유합니다 (앱 직접 연결)
 * @param locationData 목적지 장소 정보
 */
export function shareKakaoNavi(locationData: LocationData): void {
  if (typeof window === 'undefined') {
    console.error('브라우저 환경이 아닙니다.');
    return;
  }

  try {
    // 카카오내비 앱 직접 연결 URL 생성 (올바른 형식 사용)
    const appUrl = `kakaonavi://share?name=${encodeURIComponent(locationData.name)}&x=${locationData.lng}&y=${locationData.lat}&coord_type=wgs84`;
    
    // 카카오내비 앱으로만 직접 이동 (웹 폴백 없음)
    window.location.href = appUrl;
    
  } catch (error) {
    console.error('카카오 내비 목적지 공유 오류:', error);
    // 오류 발생 시에도 앱으로만 시도
    const appUrl = `kakaonavi://share?name=${encodeURIComponent(locationData.name)}&x=${locationData.lng}&y=${locationData.lat}&coord_type=wgs84`;
    window.location.href = appUrl;
  }
}

/**
 * 카카오 내비 웹 목적지 공유 URL을 생성합니다
 * @param locationData 목적지 장소 정보
 * @returns 카카오 내비 웹 공유 URL
 */
export function generateKakaoNaviShareUrl(locationData: LocationData): string {
  // 카카오 내비 웹 목적지 공유 URL 형식
  const baseUrl = 'https://map.kakao.com/link/share';
  const params = new URLSearchParams({
    name: locationData.name,
    x: locationData.lng.toString(),
    y: locationData.lat.toString(),
    coordType: 'wgs84'
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * 웹 기반 카카오 내비 기능이 사용 가능한지 확인합니다
 * @returns 웹 내비 기능 사용 가능 여부
 */
export function isKakaoNaviWebAvailable(): boolean {
  return typeof window !== 'undefined' && 
         typeof window.open === 'function';
}

/**
 * 카카오 내비 웹 길안내를 시작합니다 (즉시 실행)
 * @param locationData 목적지 장소 정보
 * @param options 길 안내 옵션
 */
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

  const { vehicleType = '1', rpOption = '1', routeInfo = true } = options;

  try {
    // 웹 기반 카카오 내비 길안내 URL 생성
    const naviUrl = generateKakaoNaviWebUrl(locationData, {
      vehicleType,
      rpOption,
      routeInfo
    });
    
    // 새 창에서 카카오 내비 웹 길안내 열기
    window.open(naviUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  } catch (error) {
    console.error('카카오 내비 웹 길 안내 시작 오류:', error);
  }
}

/**
 * 카카오 내비 웹 목적지 공유를 시작합니다 (즉시 실행)
 * @param locationData 목적지 장소 정보
 */
export function shareKakaoNaviWeb(locationData: LocationData): void {
  if (!isKakaoNaviWebAvailable()) {
    console.error('웹 기반 카카오 내비 기능을 사용할 수 없습니다.');
    return;
  }

  try {
    // 웹 기반 카카오 내비 목적지 공유 URL 생성
    const shareUrl = generateKakaoNaviShareUrl(locationData);
    
    // 새 창에서 카카오 내비 웹 목적지 공유 열기
    window.open(shareUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  } catch (error) {
    console.error('카카오 내비 웹 목적지 공유 오류:', error);
  }
}

/**
 * 두 지점 간의 거리를 계산합니다 (Haversine 공식)
 * @param lat1 첫 번째 지점의 위도
 * @param lng1 첫 번째 지점의 경도
 * @param lat2 두 번째 지점의 위도
 * @param lng2 두 번째 지점의 경도
 * @returns 거리 (킬로미터)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 지구의 반지름 (킬로미터)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
