/**
 * 카카오내비 JavaScript SDK 유틸리티
 * 공식 문서: https://developers.kakao.com/sdk/reference/js/release/Kakao.Navi.html#.start
 */

// 타입 선언 제거 - 기존 타입과 충돌 방지

/**
 * 카카오내비 SDK 초기화
 */
export function initKakaoNaviSDK(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    // 이미 초기화된 경우
    if ((window as any).Kakao && (window as any).Kakao.isInitialized()) {
      resolve(true);
      return;
    }

    // Kakao SDK가 로드되지 않은 경우
    if (!(window as any).Kakao) {
      console.error('카카오 SDK가 로드되지 않았습니다.');
      resolve(false);
      return;
    }

    try {
      const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
      if (!appKey) {
        console.error('카카오 앱 키가 설정되지 않았습니다.');
        resolve(false);
        return;
      }

      (window as any).Kakao.init(appKey);
      
      // 초기화 확인
      if ((window as any).Kakao.isInitialized()) {
        console.log('카카오내비 SDK 초기화 완료');
        resolve(true);
      } else {
        console.error('카카오내비 SDK 초기화 실패');
        resolve(false);
      }
    } catch (error) {
      console.error('카카오내비 SDK 초기화 오류:', error);
      resolve(false);
    }
  });
}

/**
 * 카카오내비 앱으로 길안내 시작
 */
export async function startKakaoNaviWithSDK(
  name: string,
  x: number,
  y: number,
  options: {
    coordType?: 'wgs84' | 'katec';
    vehicleType?: number;
    rpOption?: number;
    routeInfo?: boolean;
    sX?: number;
    sY?: number;
    sAngle?: number;
    returnUri?: string;
  } = {}
): Promise<boolean> {
  try {
    // SDK 초기화
    const isInitialized = await initKakaoNaviSDK();
    if (!isInitialized) {
      console.error('카카오내비 SDK 초기화 실패');
      return false;
    }

    // 카카오내비 앱으로 길안내 시작
    (window as any).Kakao.Navi.start({
      name,
      x,
      y,
      coordType: options.coordType || 'wgs84',
      vehicleType: options.vehicleType || 1, // 승용차
      rpOption: options.rpOption || 100, // 추천 경로
      routeInfo: options.routeInfo || false,
      sX: options.sX,
      sY: options.sY,
      sAngle: options.sAngle,
      returnUri: options.returnUri
    });

    return true;
  } catch (error) {
    console.error('카카오내비 길안내 시작 오류:', error);
    return false;
  }
}

/**
 * 카카오내비 앱으로 목적지 공유
 */
export async function shareKakaoNaviWithSDK(
  name: string,
  x: number,
  y: number,
  coordType: 'wgs84' | 'katec' = 'wgs84'
): Promise<boolean> {
  try {
    // SDK 초기화
    const isInitialized = await initKakaoNaviSDK();
    if (!isInitialized) {
      console.error('카카오내비 SDK 초기화 실패');
      return false;
    }

    // 카카오내비 앱으로 목적지 공유
    (window as any).Kakao.Navi.share({
      name,
      x,
      y,
      coordType
    });

    return true;
  } catch (error) {
    console.error('카카오내비 목적지 공유 오류:', error);
    return false;
  }
}

/**
 * 장소명으로 좌표 검색 후 카카오내비 시작
 */
export async function startKakaoNaviByPlaceName(
  placeName: string,
  options: {
    vehicleType?: number;
    rpOption?: number;
    routeInfo?: boolean;
  } = {}
): Promise<boolean> {
  try {
    // 장소명으로 좌표 검색 (간단한 예시 - 실제로는 Places API 사용)
    // 여기서는 기본 좌표를 사용하거나 사용자에게 좌표를 요청해야 함
    console.warn('장소명으로 좌표 검색이 필요합니다. 정확한 좌표를 사용하세요.');
    
    // 기본 좌표 (서울 시청)
    const defaultX = 126.9780;
    const defaultY = 37.5665;
    
    return await startKakaoNaviWithSDK(placeName, defaultX, defaultY, {
      coordType: 'wgs84',
      vehicleType: options.vehicleType || 1,
      rpOption: options.rpOption || 100,
      routeInfo: options.routeInfo || false
    });
  } catch (error) {
    console.error('장소명으로 카카오내비 시작 오류:', error);
    return false;
  }
}
