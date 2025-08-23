'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { createPortal } from 'react-dom'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
}

const toastTypes = {
  success: {
    icon: CheckCircleIcon,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-500'
  },
  error: {
    icon: ExclamationTriangleIcon,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-500'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClassName: 'text-yellow-500'
  },
  info: {
    icon: InformationCircleIcon,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClassName: 'text-blue-500'
  }
}

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const toastType = toastTypes[type]
  const Icon = toastType.icon

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose(id), 200)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, id, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 200)
  }

  return (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`relative p-4 rounded-lg border ${toastType.className} shadow-lg max-w-sm w-full`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${toastType.iconClassName}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {message && (
            <p className="text-sm mt-1 opacity-90">{message}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/5 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

export interface ToastContainerProps {
  toasts: ToastProps[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}

// Toast 관리 훅
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast
    }
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccess = (title: string, message?: string) => {
    addToast({ type: 'success', title, message })
  }

  const showError = (title: string, message?: string) => {
    addToast({ type: 'error', title, message })
  }

  const showWarning = (title: string, message?: string) => {
    addToast({ type: 'warning', title, message })
  }

  const showInfo = (title: string, message?: string) => {
    addToast({ type: 'info', title, message })
  }

  return {
    toasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast
  }
}
