'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface CarouselProps {
  children: React.ReactNode[]
  autoPlay?: boolean
  autoPlayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  className?: string
}

export default function Carousel({
  children,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  className
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % children.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + children.length) % children.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // 자동 재생
  useEffect(() => {
    if (!autoPlay || isHovered || children.length <= 1) return

    const interval = setInterval(nextSlide, autoPlayInterval)
    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, isHovered, children.length])

  if (children.length === 0) return null

  return (
    <div 
      className={cn("relative w-full", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 캐러셀 컨테이너 */}
      <div className="relative overflow-hidden rounded-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full"
          >
            {children[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 네비게이션 화살표 */}
      {showArrows && children.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute -left-12 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white/90 text-gray-400 hover:text-gray-600 rounded-full p-2.5 shadow-md transition-all duration-200 border border-gray-200/50 hover:border-gray-300"
            aria-label="이전 슬라이드"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute -right-12 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white/90 text-gray-400 hover:text-gray-600 rounded-full p-2.5 shadow-md transition-all duration-200 border border-gray-200/50 hover:border-gray-300"
            aria-label="다음 슬라이드"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </>
      )}

      {/* 인디케이터 도트 */}
      {showDots && children.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {children.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-primary-500 w-8"
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`슬라이드 ${index + 1}로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
