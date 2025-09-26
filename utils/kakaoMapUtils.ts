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

  const baseUrl = 'https://map.kakao.com/link/map';
  const params = new URLSearchParams();
  
  // 장소명과 좌표를 포함한 URL 생성
  const mapUrl = `${baseUrl}/${encodeURIComponent(locationData.name)},${locationData.lat},${locationData.lng}`;
  
  return mapUrl;
}

/**
 * 카카오맵 길찾기 URL을 생성합니다
 * @param locationData 목적지 장소 정보
 * @returns 카카오맵 길찾기 URL
 */
export function generateKakaoMapDirectionsUrl(
  locationData: LocationData
): string {
  return `https://map.kakao.com/link/navi/${encodeURIComponent(locationData.name)}`;
}

/**
 * 카카오맵 검색 URL을 생성합니다
 * @param query 검색어
 * @returns 카카오맵 검색 URL
 */
export function generateKakaoMapSearchUrl(query: string): string {
  return `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
}

/**
 * 위치 데이터로 카카오맵 검색 URL을 생성합니다
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
  return generateKakaoMapDirectionsUrl(locationData);
}

/**
 * LocationData가 유효한지 확인합니다
 * @param locationData 확인할 데이터
 * @returns 유효한 LocationData인지 여부
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
    !isNaN(locationData.lng)
  );
}

/**
 * 위치 정보를 문자열로 포맷합니다
 * @param locationData 장소 정보
 * @returns 포맷된 문자열
 */
export function formatLocationString(locationData: LocationData): string {
  return `${locationData.name} (${locationData.address})`;
}

/**
 * 카카오맵 Places API를 사용하여 장소를 검색하고 좌표를 반환합니다
 * @param query 검색어
 * @returns 검색된 장소 정보 또는 null
 */
export async function searchPlaceCoordinates(query: string): Promise<LocationData | null> {
  if (typeof window === 'undefined') {
    console.error('브라우저 환경이 아닙니다.');
    return null;
  }

  try {
    // 카카오맵이 로드되었는지 확인
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      console.error('카카오맵이 로드되지 않았습니다.');
      return null;
    }

    return new Promise((resolve) => {
      const places = new window.kakao.maps.services.Places();
      
      places.keywordSearch(query, (data: any[], status: any) => {
        if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
          const place = data[0];
          const locationData: LocationData = {
            name: place.place_name,
            address: place.road_address_name || place.address_name,
            lat: parseFloat(place.y),
            lng: parseFloat(place.x)
          };
          resolve(locationData);
        } else {
          console.warn('장소 검색 실패:', status);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('장소 검색 오류:', error);
    return null;
  }
}