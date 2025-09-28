'use client'

import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'outline' | 'filled' | 'church'
  inputSize?: 'sm' | 'default' | 'lg'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  error?: string
  success?: string
  label?: string
  helperText?: string
  required?: boolean
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
    label,
    helperText,
    required,
    id,
    ...props 
  }, ref) => {
    const generatedId = useId()
    const finalInputId = id || generatedId
    const baseClasses = "flex w-full rounded-xl border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
    
    const variantClasses = {
      default: "border-neutral-200 focus:border-primary-500 focus:ring-primary-100",
      outline: "border-2 border-primary-300 focus:border-primary-500 focus:ring-primary-100",
      filled: "border-neutral-200 bg-neutral-50 focus:border-primary-500 focus:ring-primary-100 focus:bg-white",
      church: "border-church-purple/30 focus:border-church-purple focus:ring-church-purple/20"
    }
    
    const sizeClasses = {
      sm: "h-9 px-3 py-2 text-sm min-h-[36px]", // 터치 목표 크기 고려
      default: "h-12 px-4 py-3 min-h-[44px]", // 터치 목표 크기 44px 이상
      lg: "h-14 px-6 py-4 text-base min-h-[56px]"
    }
    
    const stateClasses = error 
      ? "border-error-500 focus:border-error-500 focus:ring-error-100" 
      : success 
      ? "border-success-500 focus:border-success-500 focus:ring-success-100"
      : ""

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={finalInputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
          
          <input
            id={finalInputId}
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
            aria-invalid={!!error}
            aria-describedby={
              error ? `${finalInputId}-error` : 
              helperText ? `${finalInputId}-helper` : 
              undefined
            }
            {...props}
          />
          
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
        </div>
        
        {helperText && !error && (
          <p id={`${finalInputId}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
        
        {error && (
          <p id={`${finalInputId}-error`} className="mt-2 text-sm text-error-600 animate-fade-in-up" role="alert">
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
