'use client'

import { useEffect, useRef, useCallback } from 'react'

interface FocusManagementOptions {
  trapFocus?: boolean
  restoreFocus?: boolean
  initialFocusRef?: React.RefObject<HTMLElement>
}

export function useFocusManagement({
  trapFocus = false,
  restoreFocus = false,
  initialFocusRef
}: FocusManagementOptions = {}) {
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const containerRef = useRef<HTMLElement>(null)

  // 포커스 가능한 요소들을 찾는 함수
  const getFocusableElements = useCallback((container: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[]
  }, [])

  // 첫 번째 포커스 가능한 요소에 포커스
  const focusFirst = useCallback(() => {
    if (!containerRef.current) return

    const focusableElements = getFocusableElements(containerRef.current)
    if (focusableElements.length > 0 && focusableElements[0]) {
      focusableElements[0].focus()
    }
  }, [getFocusableElements])

  // 마지막 포커스 가능한 요소에 포커스
  const focusLast = useCallback(() => {
    if (!containerRef.current) return

    const focusableElements = getFocusableElements(containerRef.current)
    if (focusableElements.length > 0) {
      const lastElement = focusableElements[focusableElements.length - 1]
      if (lastElement) {
        lastElement.focus()
      }
    }
  }, [getFocusableElements])

  // 포커스 트랩 핸들러
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!trapFocus || !containerRef.current) return

    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements(containerRef.current)
      
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement && lastElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement && firstElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    if (event.key === 'Escape') {
      // ESC 키로 포커스 트랩 해제
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [trapFocus, restoreFocus, getFocusableElements])

  // 포커스 복원
  const restorePreviousFocus = useCallback(() => {
    if (restoreFocus && previousActiveElement.current) {
      previousActiveElement.current.focus()
    }
  }, [restoreFocus])

  // 초기화
  useEffect(() => {
    if (trapFocus) {
      // 현재 활성 요소 저장
      previousActiveElement.current = document.activeElement as HTMLElement

      // 이벤트 리스너 추가
      document.addEventListener('keydown', handleKeyDown)

      // 초기 포커스 설정
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus()
      } else {
        focusFirst()
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [trapFocus, handleKeyDown, focusFirst, initialFocusRef])

  return {
    containerRef,
    focusFirst,
    focusLast,
    restorePreviousFocus
  }
}

// 모달용 포커스 관리 훅
export function useModalFocusManagement() {
  return useFocusManagement({
    trapFocus: true,
    restoreFocus: true
  })
}

// 드롭다운용 포커스 관리 훅
export function useDropdownFocusManagement() {
  return useFocusManagement({
    trapFocus: true,
    restoreFocus: false
  })
}
