'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dark' | 'light' | 'icon-only'
  className?: string
  showText?: boolean
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl'
}

export default function Logo({ 
  size = 'md', 
  variant = 'default',
  className,
  showText = true 
}: LogoProps) {
  const logoSrc = variant === 'dark' 
    ? '/images/logo/logo-dark.png'
    : variant === 'light'
    ? '/images/logo/logo-light.png'
    : '/images/logo/logo.png'

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="relative">
        <Image
          src={logoSrc}
          alt="PrayGround 로고"
          width={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 48 : 64}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 48 : 64}
          className={cn(sizeClasses[size], 'object-contain')}
        />
      </div>
      
      {showText && (
        <span className={cn(
          'font-bold bg-gradient-to-r from-autumn-coral to-autumn-orange bg-clip-text text-transparent',
          textSizeClasses[size]
        )}>
          PrayGround
        </span>
      )}
    </div>
  )
}
