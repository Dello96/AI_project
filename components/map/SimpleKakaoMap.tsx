'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import kakaoMapManager from '@/lib/kakaoMapManager'

interface SimpleKakaoMapProps {
  className?: string
}

declare global {
  interface Window {
    kakao: any
  }
}

export default function SimpleKakaoMap({ className = '' }: SimpleKakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)

  const addDebugInfo = (info: string) => {
    console.log('SimpleKakaoMap Debug:', info)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
  }

  // 하이드레이션 안전성을 위한 마운트 확인
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY

  useEffect(() => {
    addDebugInfo('SimpleKakaoMap: 컴포넌트 마운트됨')
    addDebugInfo(`API 키: ${apiKey ? `설정됨 (길이: ${apiKey.length})` : '설정되지 않음'}`)
    addDebugInfo(`API 키 앞 10자리: ${apiKey?.substring(0, 10)}...`)
    addDebugInfo(`환경: ${process.env.NODE_ENV}`)
    addDebugInfo(`현재 도메인: ${typeof window !== 'undefined' ? window.location.hostname : 'SSR'}`)

    if (!apiKey || apiKey === 'YOUR_KAKAO_MAP_JAVASCRIPT_KEY_HERE' || apiKey.length < 10) {
      addDebugInfo('API 키 문제로 지도 로드 중단')
      setError('카카오맵 API 키가 올바르게 설정되지 않았습니다.')
      return
    }

    const loadMap = () => {
      try {
        addDebugInfo('SimpleKakaoMap: 카카오맵 로드 시작')
        addDebugInfo(`SimpleKakaoMap: window.kakao 상태 - ${!!window.kakao}`)
        addDebugInfo(`SimpleKakaoMap: window.kakao.maps 상태 - ${!!(window.kakao && window.kakao.maps)}`)
        
        // 카카오맵이 로드되었는지 확인
        if (window.kakao && window.kakao.maps) {
          addDebugInfo('SimpleKakaoMap: 카카오맵 기본 로드 완료')
          
          // LatLng 생성자가 없으면 수동으로 로드
          if (!window.kakao.maps.LatLng) {
            addDebugInfo('SimpleKakaoMap: LatLng 생성자가 없어서 수동 로드 시도')
            window.kakao.maps.load(() => {
              addDebugInfo('SimpleKakaoMap: 수동 로드 완료')
              addDebugInfo(`SimpleKakaoMap: LatLng 상태 - ${!!window.kakao.maps.LatLng}`)
              createMap()
            })
          } else {
            addDebugInfo('SimpleKakaoMap: LatLng 생성자 사용 가능')
            createMap()
          }
        } else {
          addDebugInfo('SimpleKakaoMap: 카카오맵이 로드되지 않음')
          // 카카오맵이 로드되지 않았으면 잠시 후 다시 시도
          setTimeout(() => {
            addDebugInfo('SimpleKakaoMap: 재시도 중...')
            loadMap()
          }, 1000)
        }
      } catch (error) {
        addDebugInfo(`SimpleKakaoMap: 카카오맵 로드 실패 - ${error}`)
        addDebugInfo(`SimpleKakaoMap: window.kakao 상태 - ${!!window.kakao}`)
        addDebugInfo(`SimpleKakaoMap: window.kakao.maps 상태 - ${!!(window.kakao && window.kakao.maps)}`)
        addDebugInfo(`SimpleKakaoMap: window.kakao.maps.LatLng 상태 - ${!!(window.kakao && window.kakao.maps && window.kakao.maps.LatLng)}`)
        setError(`카카오맵을 로드할 수 없습니다: ${error}`)
      }
    }

    loadMap()
  }, [apiKey])

  const createMap = () => {
    if (!mapRef.current) {
      addDebugInfo('지도 컨테이너를 찾을 수 없음')
      setError('지도 컨테이너를 찾을 수 없습니다.')
      return
    }

    try {
      addDebugInfo('SimpleKakaoMap: 지도 생성 시작')
      
      // 지도 옵션 설정 (공식 코드 방식)
      const mapOption = {
        center: new window.kakao.maps.LatLng(37.5179242320345, 127.100823924714), // 지도의 중심좌표
        level: 3 // 지도의 확대 레벨
      }
      
      // 지도를 생성합니다 (공식 코드 방식)
      const map = new window.kakao.maps.Map(mapRef.current, mapOption)
      addDebugInfo('SimpleKakaoMap: 지도 생성 완료')
      
      // 마커를 클릭하면 장소명을 표출할 인포윈도우 입니다 (공식 코드 방식)
      const infowindow = new window.kakao.maps.InfoWindow({ zIndex: 1 })
      
      // 마커를 생성하고 지도에 표시합니다 (공식 코드 방식)
      const marker = new window.kakao.maps.Marker({
        map: map,
        position: new window.kakao.maps.LatLng(37.5179242320345, 127.100823924714)
      })
      
      addDebugInfo('SimpleKakaoMap: 마커 생성 완료')
      
      // 마커에 클릭이벤트를 등록합니다 (공식 코드 방식)
      window.kakao.maps.event.addListener(marker, 'click', function() {
        // 마커를 클릭하면 장소명이 인포윈도우에 표출됩니다 (공식 코드 방식)
        infowindow.setContent(`
          <div style="padding:5px;font-size:12px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: #333;">
              잠실중앙교회
            </h3>
            <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
              서울특별시 송파구 올림픽로35길 118
            </p>
            <p style="margin: 0; font-size: 12px; color: #666;">
              📞 02-423-5303
            </p>
          </div>
        `)
        infowindow.open(map, marker)
      })

      addDebugInfo('인포윈도우 설정 완료')
      setIsLoaded(true)
      setError(null)
      
    } catch (err: any) {
      addDebugInfo(`지도 생성 오류: ${err.message || err}`)
      setError(`지도 생성 오류: ${err.message || '알 수 없는 오류'}`)
    }
  }

  // 하이드레이션 안전성을 위한 조건부 렌더링
  if (!isMounted) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-80 rounded-lg shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <div className="text-sm text-gray-500">지도를 로딩 중...</div>
          </div>
        </div>
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
            
            {/* 디버그 정보 */}
            <div className="text-left text-sm text-gray-500 mb-4 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded">
              <strong>디버그 정보:</strong>
              <div className="mt-2">
                {debugInfo.map((info, index) => (
                  <div key={index} className="text-xs">{info}</div>
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
  )
}