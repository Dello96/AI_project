'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import Alert, { AlertProps } from '@/components/ui/Alert'

interface AlertContextType {
  showAlert: (props: Omit<AlertProps, 'isOpen' | 'onClose'>) => void
  hideAlert: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<Omit<AlertProps, 'isOpen' | 'onClose'> | null>(null)

  const showAlert = (props: Omit<AlertProps, 'isOpen' | 'onClose'>) => {
    setAlert(props)
  }

  const hideAlert = () => {
    setAlert(null)
  }

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alert && (
        <Alert
          {...alert}
          isOpen={!!alert}
          onClose={hideAlert}
        />
      )}
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const context = useContext(AlertContext)
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}
