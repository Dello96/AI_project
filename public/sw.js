// Service Worker for 청년부 커뮤니티 PWA
const CACHE_NAME = 'youth-community-v1'
const urlsToCache = [
  '/',
  '/board',
  '/calendar',
  '/manifest.json',
  '/icons/icon-192x192.svg'
]

// Service Worker 설치 시 캐시 생성
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시가 열렸습니다.')
        return cache.addAll(urlsToCache)
      })
  )
})

// Service Worker 활성화 시 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시를 삭제합니다:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// 네트워크 요청 가로채기 및 캐시 전략
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 캐시된 응답 반환
        if (response) {
          return response
        }
        
        // 캐시에 없으면 네트워크 요청
        return fetch(event.request)
          .then((response) => {
            // 유효한 응답이 아니면 그대로 반환
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }
            
            // 응답을 복제하여 캐시에 저장
            const responseToCache = response.clone()
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })
            
            return response
          })
      })
  )
})

// 푸시 알림 수신 처리
self.addEventListener('push', (event) => {
  console.log('푸시 알림을 받았습니다:', event)
  
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body || '새로운 알림이 있습니다',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: true,
      silent: false
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || '청년부 커뮤니티', options)
    )
  }
})

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('알림이 클릭되었습니다:', event)
  
  event.notification.close()
  
  if (event.action === 'view') {
    // '보기' 액션 클릭 시
    const data = event.notification.data
    if (data.eventId) {
      event.waitUntil(
        clients.openWindow(`/calendar?event=${data.eventId}`)
      )
    }
  } else {
    // 기본 알림 클릭 시
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// 백그라운드 동기화 처리
self.addEventListener('sync', (event) => {
  console.log('백그라운드 동기화:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 백그라운드에서 동기화할 작업 수행
      console.log('백그라운드 동기화 실행')
    )
  }
})
