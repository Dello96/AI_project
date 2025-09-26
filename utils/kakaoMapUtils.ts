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
 * 카카오맵 길찾기 URL을 생성합니다
 * @param locationData 목적지 장소 정보
 * @param options 추가 옵션
 * @returns 카카오맵 길찾기 URL
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

  let url = `https://map.kakao.com/link/to/${name}/${lat},${lng}`;
  
  const params = new URLSearchParams();
  
  if (startAddress) {
    params.append('from', startAddress);
  }
  
  if (transportType !== 'car') {
    params.append('transport', transportType);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  return url;
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
 * 카카오 내비로 길 안내를 시작합니다
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
  if (typeof window === 'undefined' || !window.Kakao || !window.Kakao.Navi) {
    console.error('카카오 내비 API가 로드되지 않았습니다.');
    return;
  }

  const { vehicleType = '1', rpOption = '1', routeInfo = true } = options;

  try {
    window.Kakao.Navi.start({
      name: locationData.name,
      x: locationData.lng, // 경도 (longitude)
      y: locationData.lat,  // 위도 (latitude)
      coordType: 'wgs84',
      vehicleType,
      rpOption,
      routeInfo
    });
  } catch (error) {
    console.error('카카오 내비 길 안내 시작 오류:', error);
  }
}

/**
 * 카카오 내비로 목적지를 공유합니다
 * @param locationData 목적지 장소 정보
 */
export function shareKakaoNavi(locationData: LocationData): void {
  if (typeof window === 'undefined' || !window.Kakao || !window.Kakao.Navi) {
    console.error('카카오 내비 API가 로드되지 않았습니다.');
    return;
  }

  try {
    window.Kakao.Navi.share({
      name: locationData.name,
      x: locationData.lng, // 경도 (longitude)
      y: locationData.lat,  // 위도 (latitude)
      coordType: 'wgs84'
    });
  } catch (error) {
    console.error('카카오 내비 목적지 공유 오류:', error);
  }
}

/**
 * 카카오 내비 API가 로드되었는지 확인합니다
 * @returns API 로드 여부
 */
export function isKakaoNaviLoaded(): boolean {
  return typeof window !== 'undefined' && 
         window.Kakao && 
         window.Kakao.Navi && 
         typeof window.Kakao.Navi.start === 'function';
}

/**
 * 카카오 내비 API 로드를 기다립니다
 * @param timeout 타임아웃 (밀리초)
 * @returns Promise<boolean>
 */
export function waitForKakaoNavi(timeout: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isKakaoNaviLoaded()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isKakaoNaviLoaded()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
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
