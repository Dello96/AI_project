'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface SimpleKakaoMapProps {
  className?: string
}

// 카카오맵 타입 정의
declare global {
  interface Window {
    kakao: any
  }
}

export default function SimpleKakaoMap({ className = '' }: SimpleKakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 교회 위치 정보
  const churchLocation = {
    name: '잠실중앙교회',
    address: '서울특별시 송파구 올림픽로35길 118 잠실중앙교회장로회',
    lat: 37.5179242320345,
    lng: 127.100823924714,
    phone: '02-423-5303'
  }

  useEffect(() => {
    const initMap = () => {
      const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY
      
      if (!apiKey) {
        setError('카카오맵 API 키가 설정되지 않았습니다.')
        return
      }

      // 스크립트가 이미 로드되었는지 확인
      if (window.kakao && window.kakao.maps) {
        createMap()
        return
      }

      // 스크립트 동적 로드
      const script = document.createElement('script')
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}`
      script.async = true
      
      script.onload = () => {
        if (window.kakao && window.kakao.maps) {
          createMap()
        } else {
          setError('카카오맵을 로드할 수 없습니다.')
        }
      }
      
      script.onerror = () => {
        setError('카카오맵 스크립트를 로드할 수 없습니다.')
      }
      
      document.head.appendChild(script)
    }

    const createMap = () => {
      if (!mapRef.current) return

      try {
        // 지도 생성
        const container = mapRef.current
        const options = {
          center: new window.kakao.maps.LatLng(churchLocation.lat, churchLocation.lng),
          level: 3
        }

        const map = new window.kakao.maps.Map(container, options)

        // 마커 생성
        const markerPosition = new window.kakao.maps.LatLng(churchLocation.lat, churchLocation.lng)
        const marker = new window.kakao.maps.Marker({
          position: markerPosition
        })

        marker.setMap(map)

        // 인포윈도우 생성
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 200px;">
              <h3 style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold; color: #333;">
                ${churchLocation.name}
              </h3>
              <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">
                ${churchLocation.address}
              </p>
              <p style="margin: 0; font-size: 14px; color: #666;">
                📞 ${churchLocation.phone}
              </p>
            </div>
          `
        })

        // 마커 클릭 시 인포윈도우 표시
        window.kakao.maps.event.addListener(marker, 'click', () => {
          infowindow.open(map, marker)
        })

        setIsLoaded(true)
        setError(null)

      } catch (err) {
        console.error('지도 생성 오류:', err)
        setError('지도를 생성할 수 없습니다.')
      }
    }

    initMap()
  }, [])

  if (error) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">지도를 불러올 수 없습니다</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative ${className}`}
    >
      {/* 지도 컨테이너 */}
      <div 
        ref={mapRef}
        className="w-full h-80 rounded-lg shadow-lg overflow-hidden"
        style={{ minHeight: '320px' }}
      />
      
      {/* 로딩 오버레이 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">지도를 불러오는 중...</p>
          </div>
        </div>
      )}
      
      {/* 교회 정보 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-4 bg-white rounded-lg shadow-md p-4"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{churchLocation.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{churchLocation.address}</p>
            <p className="text-gray-500 text-sm">📞 {churchLocation.phone}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
