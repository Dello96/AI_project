'use client'

import { useEffect, useRef, useState } from 'react'

interface DebugKakaoMapProps {
  className?: string
}

declare global {
  interface Window {
    kakao: any
  }
}

export default function DebugKakaoMap({ className = '' }: DebugKakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const addDebugInfo = (info: string) => {
    console.log('Debug:', info)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
  }

  useEffect(() => {
    addDebugInfo('컴포넌트 마운트됨')
    
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY
    addDebugInfo(`API 키: ${apiKey ? '설정됨' : '설정되지 않음'}`)
    
    if (!apiKey) {
      setError('API 키가 설정되지 않았습니다.')
      return
    }

    // 기존 스크립트 제거
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]')
    if (existingScript) {
      addDebugInfo('기존 스크립트 제거됨')
      existingScript.remove()
    }

    // 스크립트 로드
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}`
    script.async = true
    
    script.onload = () => {
      addDebugInfo('스크립트 로드 완료')
      
      if (window.kakao && window.kakao.maps) {
        addDebugInfo('카카오맵 객체 확인됨')
        createMap()
      } else {
        addDebugInfo('카카오맵 객체를 찾을 수 없음')
        setError('카카오맵 객체를 찾을 수 없습니다.')
      }
    }
    
    script.onerror = (err) => {
      addDebugInfo(`스크립트 로드 실패: ${err}`)
      setError('스크립트 로드를 실패했습니다.')
    }
    
    addDebugInfo('스크립트 추가 중...')
    document.head.appendChild(script)
  }, [])

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
      
      // LatLng 생성자 확인
      const LatLng = window.kakao.maps.LatLng
      const Map = window.kakao.maps.Map
      const Marker = window.kakao.maps.Marker
      
      addDebugInfo(`LatLng 생성자: ${typeof LatLng}`)
      addDebugInfo(`Map 생성자: ${typeof Map}`)
      addDebugInfo(`Marker 생성자: ${typeof Marker}`)
      
      const map = new Map(mapRef.current, {
        center: new LatLng(37.5179242320345, 127.100823924714),
        level: 3
      })
      
      addDebugInfo('지도 생성 완료')
      
      const marker = new Marker({
        position: new LatLng(37.5179242320345, 127.100823924714)
      })
      
      marker.setMap(map)
      addDebugInfo('마커 생성 완료')
      
    } catch (err) {
      addDebugInfo(`지도 생성 오류: ${err}`)
      setError(`지도 생성 오류: ${err}`)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 디버그 정보 */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold mb-2">디버그 정보:</h3>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {debugInfo.map((info, index) => (
            <div key={index} className="text-sm text-gray-600">{info}</div>
          ))}
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-100 p-4 rounded-lg text-red-800">
          <strong>오류:</strong> {error}
        </div>
      )}

      {/* 지도 컨테이너 */}
      <div 
        ref={mapRef}
        className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center"
      >
        <span className="text-gray-500">지도 로딩 중...</span>
      </div>
    </div>
  )
}
