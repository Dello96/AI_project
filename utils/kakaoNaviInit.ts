/**
 * 카카오 내비 API 초기화 유틸리티
 */

// 카카오 내비 API 초기화
export function initKakaoNavi(): void {
  if (typeof window === 'undefined') return;
  
  // Kakao 객체가 이미 초기화되었는지 확인
  if (window.Kakao && (window.Kakao as any).isInitialized && (window.Kakao as any).isInitialized()) {
    return;
  }
  
  // Kakao 객체 초기화
  if (window.Kakao && (window.Kakao as any).init) {
    (window.Kakao as any).init(process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || '');
  }
}

// 카카오 내비 API 상태 확인
export function checkKakaoNaviStatus(): {
  isKakaoLoaded: boolean;
  isKakaoInitialized: boolean;
  isNaviAvailable: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      isKakaoLoaded: false,
      isKakaoInitialized: false,
      isNaviAvailable: false
    };
  }

  const isKakaoLoaded = !!window.Kakao;
  const isKakaoInitialized = isKakaoLoaded && (window.Kakao as any).isInitialized && (window.Kakao as any).isInitialized();
  const isNaviAvailable = isKakaoInitialized && !!(window.Kakao as any).Navi;

  return {
    isKakaoLoaded,
    isKakaoInitialized,
    isNaviAvailable
  };
}

// 카카오 내비 API 로드 대기
export function waitForKakaoNaviInit(timeout: number = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    // 이미 로드된 경우
    const status = checkKakaoNaviStatus();
    if (status.isNaviAvailable) {
      resolve(true);
      return;
    }

    // Kakao 객체가 로드되지 않은 경우 초기화 시도
    if (!status.isKakaoLoaded) {
      initKakaoNavi();
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const currentStatus = checkKakaoNaviStatus();
      
      if (currentStatus.isNaviAvailable) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}
