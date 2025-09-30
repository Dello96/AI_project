'use client'

declare global {
  interface Window {
    kakao: any
  }
}

class KakaoMapManager {
  private static instance: KakaoMapManager
  private isLoaded = false
  private isLoading = false
  private loadPromise: Promise<void> | null = null
  private listeners: Array<() => void> = []

  private constructor() {}

  static getInstance(): KakaoMapManager {
    if (!KakaoMapManager.instance) {
      KakaoMapManager.instance = new KakaoMapManager()
    }
    return KakaoMapManager.instance
  }

  // 카카오맵 로딩 상태 확인
  isMapLoaded(): boolean {
    const hasKakao = !!window.kakao
    const hasMaps = !!(window.kakao && window.kakao.maps)
    const hasLatLng = !!(window.kakao && window.kakao.maps && window.kakao.maps.LatLng)
    const hasMap = !!(window.kakao && window.kakao.maps && window.kakao.maps.Map)
    const hasMarker = !!(window.kakao && window.kakao.maps && window.kakao.maps.Marker)
    const hasInfoWindow = !!(window.kakao && window.kakao.maps && window.kakao.maps.InfoWindow)
    const hasLatLngBounds = !!(window.kakao && window.kakao.maps && window.kakao.maps.LatLngBounds)
    
    // LatLng가 없으면 수동으로 로드 시도
    if (hasKakao && hasMaps && !hasLatLng) {
      try {
        window.kakao.maps.load(() => {
          this.isLoaded = true
        })
      } catch (error) {
        console.error('KakaoMapManager: 수동 로드 실패:', error)
      }
    }
    
    const isFullyLoaded = this.isLoaded && hasKakao && hasMaps && hasLatLng && hasMap && hasMarker && hasInfoWindow && hasLatLngBounds
    
    return isFullyLoaded
  }

  // 카카오맵 로딩 대기
  async waitForMapLoad(): Promise<void> {
    if (this.isMapLoaded()) {
      return Promise.resolve()
    }

    if (this.loadPromise) {
      return this.loadPromise
    }

    this.loadPromise = this.loadMap()
    return this.loadPromise
  }

  // LatLng 생성자 대기
  async waitForLatLng(): Promise<void> {
    return new Promise((resolve, reject) => {
      let checkCount = 0
      const maxChecks = 50 // 5초간 100ms마다 체크
      
      const checkLatLng = () => {
        checkCount++
        
        if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
          resolve()
          return
        }
        
        if (checkCount >= maxChecks) {
          console.error('KakaoMapManager: LatLng 생성자 로딩 타임아웃')
          console.error('KakaoMapManager: 현재 상태:', {
            hasKakao: !!window.kakao,
            hasMaps: !!(window.kakao && window.kakao.maps),
            hasLatLng: !!(window.kakao && window.kakao.maps && window.kakao.maps.LatLng),
            mapsKeys: window.kakao && window.kakao.maps ? Object.keys(window.kakao.maps) : 'N/A'
          })
          reject(new Error('LatLng 생성자 로딩 타임아웃'))
          return
        }
        
        setTimeout(checkLatLng, 100)
      }
      
      checkLatLng()
    })
  }

  // 대체 로딩 방법 - 스크립트가 로드되지 않은 경우
  async loadKakaoMapScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 이미 스크립트가 로드되어 있는지 확인
      if (window.kakao && window.kakao.maps) {
        resolve()
        return
      }

      // 스크립트 동적 로딩
      const script = document.createElement('script')
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`
      script.async = true
      
      script.onload = () => {
        if (window.kakao && window.kakao.maps) {
          resolve()
        } else {
          reject(new Error('카카오맵 스크립트 로드 후에도 kakao.maps를 찾을 수 없습니다'))
        }
      }
      
      script.onerror = (error) => {
        console.error('KakaoMapManager: 대체 스크립트 로드 실패:', error)
        reject(new Error('카카오맵 스크립트 로드 실패'))
      }
      
      document.head.appendChild(script)
    })
  }

  // 카카오맵 로드
  private async loadMap(): Promise<void> {
    if (this.isLoading) {
      return new Promise((resolve) => {
        this.listeners.push(resolve)
      })
    }

    this.isLoading = true

    return new Promise((resolve, reject) => {
      
      // 이미 로드되어 있는지 확인
      if (this.isMapLoaded()) {
        this.isLoaded = true
        this.isLoading = false
        this.notifyListeners()
        resolve()
        return
      }

      // 카카오맵이 부분적으로 로드된 경우
      if (window.kakao && !window.kakao.maps) {
        try {
          window.kakao.maps.load(() => {
            this.isLoaded = true
            this.isLoading = false
            this.notifyListeners()
            resolve()
          })
        } catch (error) {
          console.error('KakaoMapManager: 카카오맵 수동 로드 실패:', error)
          this.isLoading = false
          reject(error)
        }
        return
      }

      // 카카오 객체가 아예 없는 경우 - 더 자주 체크
      let checkCount = 0
      const maxChecks = 100 // 10초간 100ms마다 체크
      
      const checkInterval = setInterval(() => {
        checkCount++
        
        if (window.kakao) {
          clearInterval(checkInterval)
          
          if (window.kakao.maps) {
            this.isLoaded = true
            this.isLoading = false
            this.notifyListeners()
            resolve()
          } else {
            try {
              window.kakao.maps.load(() => {
                this.isLoaded = true
                this.isLoading = false
                this.notifyListeners()
                resolve()
              })
            } catch (error) {
              console.error('KakaoMapManager: 카카오맵 로드 실패:', error)
              this.isLoading = false
              reject(error)
            }
          }
        } else if (checkCount >= maxChecks) {
          clearInterval(checkInterval)
          console.error('KakaoMapManager: 카카오 객체 로딩 타임아웃, 대체 로딩 시도')
          
          // 대체 로딩 방법 시도
          this.loadKakaoMapScript()
            .then(() => {
              this.isLoaded = true
              this.isLoading = false
              this.notifyListeners()
              resolve()
            })
            .catch((error) => {
              console.error('KakaoMapManager: 대체 로딩도 실패:', error)
              this.isLoading = false
              reject(new Error('카카오맵 스크립트 로딩 실패'))
            })
        }
      }, 100)
    })
  }

  // 리스너들에게 로딩 완료 알림
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
    this.listeners = []
  }

  // 지도 인스턴스 생성
  createMap(container: HTMLElement, options: any): any {
    
    if (!this.isMapLoaded()) {
      const errorMsg = `카카오맵이 로드되지 않았습니다. 상태: isLoaded=${this.isLoaded}, kakao=${!!window.kakao}, maps=${!!(window.kakao && window.kakao.maps)}, Map=${!!(window.kakao && window.kakao.maps && window.kakao.maps.Map)}`
      console.error('KakaoMapManager:', errorMsg)
      throw new Error(errorMsg)
    }
    
    try {
      const map = new window.kakao.maps.Map(container, options)
      return map
    } catch (error) {
      console.error('KakaoMapManager: Map 생성 실패:', error)
      throw new Error(`Map 생성 실패: ${error}`)
    }
  }

  // Places 서비스 생성
  createPlaces(): any {
    if (!this.isMapLoaded()) {
      throw new Error('카카오맵이 로드되지 않았습니다.')
    }
    return new window.kakao.maps.services.Places()
  }

  // LatLng 생성
  createLatLng(lat: number, lng: number): any {
    
    // LatLng 생성자가 없으면 수동으로 로드 시도
    if (window.kakao && window.kakao.maps && !window.kakao.maps.LatLng) {
      try {
        window.kakao.maps.load(() => {
          this.isLoaded = true
        })
      } catch (error) {
        console.error('KakaoMapManager: 수동 로드 실패:', error)
      }
    }
    
    // LatLng 생성자가 여전히 없으면 에러
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.LatLng) {
      const errorMsg = `LatLng 생성자를 사용할 수 없습니다. 상태: kakao=${!!window.kakao}, maps=${!!(window.kakao && window.kakao.maps)}, LatLng=${!!(window.kakao && window.kakao.maps && window.kakao.maps.LatLng)}`
      console.error('KakaoMapManager:', errorMsg)
      throw new Error(errorMsg)
    }
    
    try {
      const latLng = new window.kakao.maps.LatLng(lat, lng)
      return latLng
    } catch (error) {
      console.error('KakaoMapManager: LatLng 생성 실패:', error)
      throw new Error(`LatLng 생성 실패: ${error}`)
    }
  }

  // LatLngBounds 생성
  createLatLngBounds(): any {
    if (!this.isMapLoaded()) {
      const errorMsg = `카카오맵이 로드되지 않았습니다. 상태: isLoaded=${this.isLoaded}, kakao=${!!window.kakao}, maps=${!!(window.kakao && window.kakao.maps)}, LatLng=${!!(window.kakao && window.kakao.maps && window.kakao.maps.LatLng)}`
      console.error('KakaoMapManager:', errorMsg)
      throw new Error(errorMsg)
    }
    
    try {
      const bounds = new window.kakao.maps.LatLngBounds()
      return bounds
    } catch (error) {
      console.error('KakaoMapManager: LatLngBounds 생성 실패:', error)
      throw new Error(`LatLngBounds 생성 실패: ${error}`)
    }
  }

  // Marker 생성
  createMarker(options: any): any {
    if (!this.isMapLoaded()) {
      const errorMsg = `카카오맵이 로드되지 않았습니다. 상태: isLoaded=${this.isLoaded}, kakao=${!!window.kakao}, maps=${!!(window.kakao && window.kakao.maps)}, LatLng=${!!(window.kakao && window.kakao.maps && window.kakao.maps.LatLng)}`
      console.error('KakaoMapManager:', errorMsg)
      throw new Error(errorMsg)
    }
    
    try {
      const marker = new window.kakao.maps.Marker(options)
      return marker
    } catch (error) {
      console.error('KakaoMapManager: Marker 생성 실패:', error)
      throw new Error(`Marker 생성 실패: ${error}`)
    }
  }

  // InfoWindow 생성
  createInfoWindow(options: any): any {
    if (!this.isMapLoaded()) {
      const errorMsg = `카카오맵이 로드되지 않았습니다. 상태: isLoaded=${this.isLoaded}, kakao=${!!window.kakao}, maps=${!!(window.kakao && window.kakao.maps)}, LatLng=${!!(window.kakao && window.kakao.maps && window.kakao.maps.LatLng)}`
      console.error('KakaoMapManager:', errorMsg)
      throw new Error(errorMsg)
    }
    
    try {
      const infoWindow = new window.kakao.maps.InfoWindow(options)
      return infoWindow
    } catch (error) {
      console.error('KakaoMapManager: InfoWindow 생성 실패:', error)
      throw new Error(`InfoWindow 생성 실패: ${error}`)
    }
  }

  // 로딩 상태 리셋 (개발용)
  reset(): void {
    this.isLoaded = false
    this.isLoading = false
    this.loadPromise = null
    this.listeners = []
  }
}

export default KakaoMapManager.getInstance()
