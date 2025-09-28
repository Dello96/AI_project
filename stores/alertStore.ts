'use client'

import { create } from 'zustand'
import { AlertProps } from '@/components/ui/Alert'

interface AlertStore {
  // State
  alert: Omit<AlertProps, 'isOpen' | 'onClose'> | null
  
  // Actions
  showAlert: (props: Omit<AlertProps, 'isOpen' | 'onClose'>) => void
  hideAlert: () => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

export const useAlertStore = create<AlertStore>((set) => ({
  // Initial state
  alert: null,

  // Actions
  showAlert: (props) => {
    set({ alert: props })
  },

  hideAlert: () => {
    set({ alert: null })
  },

  showSuccess: (title: string, message?: string) => {
    set({
      alert: {
        type: 'success',
        title,
        message: message || ''
      }
    })
  },

  showError: (title: string, message?: string) => {
    set({
      alert: {
        type: 'error',
        title,
        message: message || ''
      }
    })
  },

  showWarning: (title: string, message?: string) => {
    set({
      alert: {
        type: 'warning',
        title,
        message: message || ''
      }
    })
  },

  showInfo: (title: string, message?: string) => {
    set({
      alert: {
        type: 'info',
        title,
        message: message || ''
      }
    })
  }
}))
