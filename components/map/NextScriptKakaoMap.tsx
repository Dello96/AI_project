'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Script from 'next/script'

interface NextScriptKakaoMapProps {
  className?: string
}

declare global {
  interface Window {
    kakao: any
  }
}

export default function NextScriptKakaoMap({ className = '' }: NextScriptKakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (info: string) => {
    console.log('NextScriptKakaoMap Debug:', info)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
  }

  const createMap = () => {
    if (!mapRef.current) {
      addDebugInfo('지도 컨테이너를 찾을 수 없음')
      setError('지도 컨테이너를 찾을 수 없습니다.')
      return
    }

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.LatLng) {
      addDebugInfo('카카오맵 API가 완전히 로드되지 않음')
      setError('카카오맵 API가 완전히 로드되지 않았습니다.')
      return
    }

    try {
      addDebugInfo('지도 생성 시작')
      
      const { LatLng, Map, Marker } = window.kakao.maps
      
      addDebugInfo(`LatLng: ${typeof LatLng}`)
      addDebugInfo(`Map: ${typeof Map}`)
      addDebugInfo(`Marker: ${typeof Marker}`)
      
      if (typeof LatLng !== 'function') {
        throw new Error('LatLng가 함수가 아닙니다.')
      }
      
      if (typeof Map !== 'function') {
        throw new Error('Map이 함수가 아닙니다.')
      }
      
      if (typeof Marker !== 'function') {
        throw new Error('Marker가 함수가 아닙니다.')
      }
      
      // 지도 생성
      const map = new Map(mapRef.current, {
        center: new LatLng(37.5179242320345, 127.100823924714),
        level: 3
      })
      
      addDebugInfo('지도 생성 완료')
      
      // 마커 생성
      const marker = new Marker({
        position: new LatLng(37.5179242320345, 127.100823924714)
      })
      
      marker.setMap(map)
      addDebugInfo('마커 생성 완료')
      
      // 인포윈도우 생성
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold; color: #333;">
              잠실중앙교회
            </h3>
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">
              서울특별시 송파구 올림픽로35길 118
            </p>
            <p style="margin: 0; font-size: 14px; color: #666;">
              📞 02-423-5303
            </p>
          </div>
        `
      })

      // 마커 클릭 시 인포윈도우 표시
      window.kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(map, marker)
      })

      addDebugInfo('인포윈도우 설정 완료')
      setIsLoaded(true)
      setError(null)
      
    } catch (err) {
      addDebugInfo(`지도 생성 오류: ${err}`)
      setError(`지도 생성 오류: ${err}`)
    }
  }

  const handleScriptLoad = () => {
    addDebugInfo('카카오맵 스크립트 로드 완료')
    
    if (window.kakao && window.kakao.maps) {
      addDebugInfo('카카오맵 객체 확인됨')
      
      // kakao.maps.load() 사용
      window.kakao.maps.load(() => {
        addDebugInfo('카카오맵 로드 콜백 실행')
        createMap()
      })
    } else {
      addDebugInfo('카카오맵 객체를 찾을 수 없음')
      setError('카카오맵 객체를 찾을 수 없습니다.')
    }
  }

  const handleScriptError = (error?: any) => {
    addDebugInfo(`카카오맵 스크립트 로드 실패: ${error?.message || '알 수 없는 오류'}`)
    console.error('카카오맵 스크립트 로드 실패:', error)
    setError(`카카오맵 스크립트를 로드할 수 없습니다. ${error?.message || ''}`)
  }

  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY

  // API 키 검증 강화
  if (!apiKey || apiKey === 'YOUR_KAKAO_MAP_JAVASCRIPT_KEY_HERE' || apiKey.length < 10) {
    addDebugInfo(`API 키 문제: ${apiKey ? `길이: ${apiKey.length}` : '없음'}`)
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">API 키가 설정되지 않았습니다</h3>
        <p className="text-gray-600">카카오맵 API 키를 설정해주세요.</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>현재 환경: {process.env.NODE_ENV}</p>
          <p>API 키 길이: {apiKey?.length || 0}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Next.js Script 컴포넌트로 카카오맵 로드 */}
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
        onReady={() => {
          addDebugInfo('Script onReady 호출됨')
        }}
      />
      
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
        {!isLoaded && !error && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">지도를 불러오는 중...</p>
            </div>
          </div>
        )}

        {/* 오류 메시지 */}
        {error && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
            <div className="text-center p-4">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">지도를 불러올 수 없습니다</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="text-left text-sm text-gray-500 mb-4 max-h-32 overflow-y-auto">
                <strong>디버그 정보:</strong>
                <div className="mt-2">
                  {debugInfo.map((info, index) => (
                    <div key={index}>{info}</div>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                다시 시도
              </button>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-1">잠실중앙교회</h3>
              <p className="text-gray-600 text-sm mb-2">서울특별시 송파구 올림픽로35길 118</p>
              <p className="text-gray-500 text-sm">📞 02-423-5303</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}
