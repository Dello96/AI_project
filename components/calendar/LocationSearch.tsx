'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { MapPinIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import kakaoMapManager from '@/lib/kakaoMapManager'

interface LocationSearchProps {
  onLocationSelect: (location: {
    name: string
    address: string
    lat: number
    lng: number
  }) => void
  initialValue?: string
  placeholder?: string
}

declare global {
  interface Window {
    kakao: any
  }
}

export default function LocationSearch({ 
  onLocationSelect, 
  initialValue = '',
  placeholder = '장소를 검색하세요'
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markers = useRef<any[]>([])

  // 하이드레이션 안전성을 위한 마운트 확인
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 카카오맵 로드 확인
  useEffect(() => {
    if (!isMounted) return

    const loadKakaoMap = () => {
      try {
        console.log('LocationSearch: 카카오맵 로드 시작')
        console.log('LocationSearch: window.kakao 상태:', !!window.kakao)
        console.log('LocationSearch: window.kakao.maps 상태:', !!(window.kakao && window.kakao.maps))
        console.log('LocationSearch: window.kakao.maps.services 상태:', !!(window.kakao && window.kakao.maps && window.kakao.maps.services))
        
        // 카카오맵이 로드되었는지 확인
        if (window.kakao && window.kakao.maps) {
          console.log('LocationSearch: 카카오맵 기본 로드 완료')
          
          // Places 서비스가 로드되었는지 확인
          if (window.kakao.maps.services) {
            console.log('LocationSearch: Places 서비스 사용 가능')
            console.log('LocationSearch: LatLng 상태:', !!window.kakao.maps.LatLng)
            setIsMapLoaded(true)
          } else {
            console.error('LocationSearch: Places 서비스가 로드되지 않음')
            // Places 서비스가 로드되지 않았으면 잠시 후 다시 시도
            setTimeout(() => {
              console.log('LocationSearch: Places 서비스 재시도 중...')
              loadKakaoMap()
            }, 2000)
          }
        } else {
          console.error('LocationSearch: 카카오맵이 로드되지 않음')
          // 카카오맵이 로드되지 않았으면 잠시 후 다시 시도
          setTimeout(() => {
            console.log('LocationSearch: 재시도 중...')
            loadKakaoMap()
          }, 1000)
        }
      } catch (error) {
        console.error('LocationSearch: 카카오맵 로드 실패:', error)
        console.error('LocationSearch: window.kakao 상태:', !!window.kakao)
        console.error('LocationSearch: window.kakao.maps 상태:', !!(window.kakao && window.kakao.maps))
        console.error('LocationSearch: window.kakao.maps.services 상태:', !!(window.kakao && window.kakao.maps && window.kakao.maps.services))
      }
    }

    loadKakaoMap()
  }, [isMounted])

  // 장소 검색 함수 (카카오지도 API 공식 코드 방식)
  const searchPlaces = () => {
    console.log('LocationSearch: searchPlaces 호출됨')
    console.log('LocationSearch: isMapLoaded:', isMapLoaded)
    console.log('LocationSearch: searchQuery:', searchQuery)
    
    if (!isMapLoaded || !searchQuery.trim()) {
      console.log('카카오맵이 완전히 로드되지 않았거나 검색어가 없습니다.')
      return
    }

    // Places 서비스가 사용 가능한지 확인
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      console.error('Places 서비스를 사용할 수 없습니다.')
      console.error('window.kakao:', !!window.kakao)
      console.error('window.kakao.maps:', !!(window.kakao && window.kakao.maps))
      console.error('window.kakao.maps.services:', !!(window.kakao && window.kakao.maps && window.kakao.maps.services))
      alert('장소 검색 서비스를 사용할 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }

    setIsSearching(true)
    
    // 기존 마커 제거
    markers.current.forEach(marker => marker.setMap(null))
    markers.current = []

    try {
      console.log('LocationSearch: Places 서비스 생성 시도')
      
      // 장소 검색 객체를 생성합니다 (공식 코드 방식)
      const ps = new window.kakao.maps.services.Places()
      console.log('LocationSearch: Places 서비스 생성 성공')
      
      // 키워드로 장소를 검색합니다 (공식 코드 방식)
      console.log('LocationSearch: 키워드 검색 시작:', searchQuery)
      ps.keywordSearch(searchQuery, placesSearchCB)
      
    } catch (error) {
      setIsSearching(false)
      console.error('LocationSearch: 장소 검색 중 오류:', error)
      console.error('LocationSearch: error type:', typeof error)
      console.error('LocationSearch: error message:', error instanceof Error ? error.message : String(error))
      alert(`장소 검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 키워드 검색 완료 시 호출되는 콜백함수 (공식 코드 방식)
  const placesSearchCB = (data: any[], status: any, pagination: any) => {
    console.log('LocationSearch: placesSearchCB 호출됨')
    console.log('LocationSearch: status:', status)
    console.log('LocationSearch: data:', data)
    console.log('LocationSearch: data.length:', data?.length || 0)
    console.log('LocationSearch: pagination:', pagination)
    
    setIsSearching(false)
    
    try {
      if (status === window.kakao.maps.services.Status.OK) {
        console.log('LocationSearch: 검색 성공, 결과:', data.length, '개')
        setSearchResults(data || [])
        
        // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해
        // LatLngBounds 객체에 좌표를 추가합니다 (공식 코드 방식)
        if (mapInstance.current && data && data.length > 0) {
          console.log('LocationSearch: 지도에 마커 표시 시작')
          const bounds = new window.kakao.maps.LatLngBounds()
          
          for (let i = 0; i < data.length; i++) {
            try {
              displayMarker(data[i])
              bounds.extend(new window.kakao.maps.LatLng(data[i].y, data[i].x))
            } catch (markerError) {
              console.error('LocationSearch: 마커 표시 오류:', markerError)
            }
          }
          
          // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다 (공식 코드 방식)
          mapInstance.current.setBounds(bounds)
          console.log('LocationSearch: 지도 범위 조정 완료')
        }
      } else {
        setSearchResults([])
        console.error('LocationSearch: 장소 검색 실패')
        console.error('LocationSearch: status:', status)
        console.error('LocationSearch: Status.OK:', window.kakao.maps.services.Status.OK)
        
        let errorMessage = '장소 검색에 실패했습니다.'
        if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          errorMessage = '검색 결과가 없습니다. 다른 키워드로 검색해보세요.'
        } else if (status === window.kakao.maps.services.Status.ERROR) {
          errorMessage = '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        }
        
        alert(errorMessage)
      }
    } catch (error) {
      console.error('LocationSearch: placesSearchCB 처리 중 오류:', error)
      setSearchResults([])
      alert(`검색 결과 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 지도에 마커를 표시하는 함수 (공식 코드 방식)
  const displayMarker = (place: any) => {
    if (!mapInstance.current) {
      console.error('LocationSearch: displayMarker - 지도 인스턴스가 없습니다')
      return
    }
    
    try {
      console.log('LocationSearch: displayMarker - 마커 생성 시작:', place.place_name)
      
      // 마커를 생성하고 지도에 표시합니다 (공식 코드 방식)
      const marker = new window.kakao.maps.Marker({
        map: mapInstance.current,
        position: new window.kakao.maps.LatLng(place.y, place.x)
      })
      
      console.log('LocationSearch: displayMarker - 마커 생성 완료')
      
      // 마커에 클릭이벤트를 등록합니다 (공식 코드 방식)
      window.kakao.maps.event.addListener(marker, 'click', function() {
        try {
          // 마커를 클릭하면 장소명이 인포윈도우에 표출됩니다 (공식 코드 방식)
          const infowindow = new window.kakao.maps.InfoWindow({
            zIndex: 1,
            content: '<div style="padding:5px;font-size:12px;">' + place.place_name + '</div>'
          })
          infowindow.open(mapInstance.current, marker)
          console.log('LocationSearch: displayMarker - 인포윈도우 표시 완료')
        } catch (infowindowError) {
          console.error('LocationSearch: displayMarker - 인포윈도우 오류:', infowindowError)
        }
      })
      
      // 마커를 배열에 저장
      markers.current.push(marker)
      console.log('LocationSearch: displayMarker - 마커 저장 완료')
      
    } catch (error) {
      console.error('LocationSearch: displayMarker - 마커 생성 오류:', error)
      console.error('LocationSearch: place 데이터:', place)
    }
  }

  // 장소 선택 함수
  const selectLocation = (place: any) => {
    const location = {
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      lat: parseFloat(place.y),
      lng: parseFloat(place.x)
    }
    
    onLocationSelect(location)
    setSearchQuery(location.name)
    setSearchResults([])
  }

  // 지도 초기화
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return

    const container = mapRef.current
    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심
      level: 3
    }

    try {
      mapInstance.current = new window.kakao.maps.Map(container, options)
      console.log('LocationSearch: 지도 초기화 완료')
    } catch (error) {
      console.error('LocationSearch: 지도 초기화 실패:', error)
    }
  }, [isMapLoaded])

  // Enter 키로 검색
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      searchPlaces()
    }
  }

  // 하이드레이션 안전성을 위한 조건부 렌더링
  if (!isMounted) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="pl-10"
            />
          </div>
          <Button 
            disabled={true}
            className="px-4"
          >
            로딩중...
          </Button>
        </div>
        <div className="w-full h-48 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <div className="text-sm text-gray-500">지도를 로딩 중...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 검색 입력 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={searchPlaces}
          disabled={!searchQuery.trim() || isSearching || !isMapLoaded}
          className="px-4"
        >
          {isSearching ? '검색중...' : !isMapLoaded ? '지도 로딩중...' : '검색'}
        </Button>
      </div>

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <Card className="max-h-48 overflow-y-auto">
          <CardContent className="p-0">
            {searchResults.map((place, index) => (
              <div
                key={index}
                onClick={() => selectLocation(place)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {place.place_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {place.road_address_name || place.address_name}
                    </div>
                    {place.phone && (
                      <div className="text-xs text-gray-400 mt-1">
                        {place.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 지도 */}
      {isMapLoaded && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">위치 미리보기</div>
          <div 
            ref={mapRef}
            className="w-full h-48 rounded-lg border border-gray-200"
          />
        </div>
      )}

      {!isMapLoaded && (
        <div className="w-full h-48 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">지도를 로딩 중...</div>
            <div className="text-xs text-gray-400">
              {window.kakao ? 
                (window.kakao.maps ? 
                  (window.kakao.maps.LatLng ? '지도 초기화 중...' : '카카오맵 API 로딩 중...') : 
                  '카카오맵 로딩 중...') : 
                '카카오맵 스크립트 로딩 중...'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
