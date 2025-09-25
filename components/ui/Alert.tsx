'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'

export interface AlertProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export default function Alert({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'success',
  duration = 3000 
}: AlertProps) {
  // 자동 닫기
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />
      case 'error':
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
      case 'info':
        return <InformationCircleIcon className="w-6 h-6 text-blue-600" />
      default:
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />
    }
  }

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          button: 'text-green-600 hover:bg-green-100'
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          button: 'text-red-600 hover:bg-red-100'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          button: 'text-yellow-600 hover:bg-yellow-100'
        }
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          button: 'text-blue-600 hover:bg-blue-100'
        }
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          button: 'text-green-600 hover:bg-green-100'
        }
    }
  }

  const colors = getColors()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
          className="fixed top-4 right-4 z-[100] max-w-sm w-full"
        >
          <div className={`
            ${colors.bg} 
            ${colors.border} 
            border rounded-xl shadow-lg p-4
            backdrop-blur-sm bg-opacity-95
          `}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
              
              <div className="ml-3 flex-1">
                <h3 className={`text-sm font-semibold ${colors.text}`}>
                  {title}
                </h3>
                {message && (
                  <p className={`mt-1 text-sm ${colors.text} opacity-90`}>
                    {message}
                  </p>
                )}
              </div>
              
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={onClose}
                  className={`
                    ${colors.button}
                    rounded-lg p-1 transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current
                  `}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
