'use client'

import { useAlertStore } from '@/stores/alertStore'
import Alert from './Alert'

interface AlertProviderProps {
  children: React.ReactNode
}

export function AlertProvider({ children }: AlertProviderProps) {
  const alert = useAlertStore((state) => state.alert)
  const hideAlert = useAlertStore((state) => state.hideAlert)

  return (
    <>
      {children}
      {alert && (
        <Alert
          {...alert}
          isOpen={!!alert}
          onClose={hideAlert}
        />
      )}
    </>
  )
}
