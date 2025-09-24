'use client'

interface LoadingSpinnerProps {
  message?: string
  subMessage?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ 
  message = "잠시만 기다려주세요",
  subMessage,
  size = 'md',
  className = ""
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  }

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  }

  const subTextSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  }

  return (
    <div className={`min-h-screen bg-black flex items-center justify-center ${className}`}>
      <div className="text-center space-y-6">
        {/* 로딩 메시지 */}
        <div className="space-y-3">
          <h2 className={`font-bold text-white mb-2 ${textSizeClasses[size]}`}>
            {message}
          </h2>
          {subMessage && (
            <p className={`text-gray-400 ${subTextSizeClasses[size]}`}>
              {subMessage}
            </p>
          )}
        </div>
        
        {/* Circle 로딩 애니메이션 */}
        <div className={`${sizeClasses[size]} border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin mx-auto`}></div>
      </div>
    </div>
  )
}
