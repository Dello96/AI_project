/**
 * 카카오맵 관련 유틸리티 함수들
 */

export interface LocationData {
  name: string;
  address: string;
  lat: number;
  lng: number;
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
