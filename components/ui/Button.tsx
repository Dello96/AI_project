'use client'

import React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-theme-primary text-white shadow-medium hover:shadow-large hover:scale-105",
        destructive: "bg-red-500 text-white shadow-medium hover:shadow-large hover:scale-105",
        outline: "border-2 border-theme-primary bg-background text-theme-primary hover:bg-theme-primary hover:text-white hover:border-theme-primary",
        secondary: "bg-theme-secondary text-theme-primary shadow-medium hover:shadow-large hover:scale-105",
        accent: "bg-theme-accent text-theme-primary shadow-medium hover:shadow-large hover:scale-105",
        ghost: "hover:bg-theme-light hover:text-theme-primary",
        link: "text-theme-primary underline-offset-4 hover:underline",
        success: "bg-green-500 text-white shadow-medium hover:shadow-large hover:scale-105",
        warning: "bg-yellow-500 text-white shadow-medium hover:shadow-large hover:scale-105",
        // 교회/청년부 특화 버튼
        church: "bg-theme-primary text-white shadow-medium hover:shadow-large hover:scale-105",
        youth: "bg-theme-secondary text-theme-primary shadow-medium hover:shadow-large hover:scale-105",
      },
      size: {
        default: "h-12 px-6 py-3 min-h-[44px] min-w-[44px]", // 터치 목표 크기 44px 이상
        sm: "h-9 rounded-lg px-3 min-h-[36px] min-w-[36px]",
        lg: "h-14 rounded-2xl px-8 py-4 text-base min-h-[56px] min-w-[56px]",
        xl: "h-16 rounded-2xl px-10 py-5 text-lg min-h-[64px] min-w-[64px]",
        icon: "h-10 w-10 min-h-[40px] min-w-[40px]",
      },
      animation: {
        none: "",
        bounce: "animate-bounce-gentle",
        pulse: "animate-pulse-soft",
        fadeIn: "animate-fade-in-up",
        slideIn: "animate-slide-in-right",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "variant" | "size">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    loading = false,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, animation, className }))}
        ref={ref}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        {...props}
      >
        {loading && (
          <motion.div
            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        
        <span className={cn(
          "flex items-center justify-center",
          loading && "opacity-70"
        )}>
          {children as React.ReactNode}
        </span>
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
