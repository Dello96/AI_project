'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'outline' | 'filled' | 'church'
  inputSize?: 'sm' | 'default' | 'lg'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  error?: string
  success?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant = 'default',
    inputSize = 'default',
    icon,
    iconPosition = 'left',
    error,
    success,
    ...props 
  }, ref) => {
    const baseClasses = "flex w-full rounded-xl border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
    
    const variantClasses = {
      default: "border-neutral-200 focus:border-primary-500 focus:ring-primary-100",
      outline: "border-2 border-primary-300 focus:border-primary-500 focus:ring-primary-100",
      filled: "border-neutral-200 bg-neutral-50 focus:border-primary-500 focus:ring-primary-100 focus:bg-white",
      church: "border-church-purple/30 focus:border-church-purple focus:ring-church-purple/20"
    }
    
    const sizeClasses = {
      sm: "h-9 px-3 py-2 text-sm",
      default: "h-12 px-4 py-3",
      lg: "h-14 px-6 py-4 text-base"
    }
    
    const stateClasses = error 
      ? "border-error-500 focus:border-error-500 focus:ring-error-100" 
      : success 
      ? "border-success-500 focus:border-success-500 focus:ring-success-100"
      : ""

    return (
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[inputSize],
            stateClasses,
            icon && iconPosition === 'left' && "pl-10",
            icon && iconPosition === 'right' && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        
        {error && (
          <p className="mt-2 text-sm text-error-600 animate-fade-in-up">
            {error}
          </p>
        )}
        
        {success && (
          <p className="mt-2 text-sm text-success-600 animate-fade-in-up">
            {success}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
