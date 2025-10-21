import { User, AuthState, SignupForm, SignInData } from '@/types'
import { AlertProps } from '@/components/ui/Alert'
import { Event } from '@/types'
import { ChatMessage, ChatBotConfig, ChatAttachment } from '@/types'

// Auth Store Types
export interface AuthStore extends AuthState {
  signUp: (data: SignupForm) => Promise<{ success: boolean; message: string }>
  signIn: (data: SignInData) => Promise<{ success: boolean; message: string }>
  signOut: () => Promise<void>
  checkUser: () => Promise<boolean>
  getAccessToken: () => Promise<string | null>
  initializeAuth: () => Promise<(() => void) | undefined>
}

// Alert Store Types
export interface AlertStore {
  alert: Omit<AlertProps, 'isOpen' | 'onClose'> | null
  showAlert: (props: Omit<AlertProps, 'isOpen' | 'onClose'>) => void
  hideAlert: () => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

// Events Store Types
export interface EventsStore {
  events: Event[]
  isLoading: boolean
  error: string | null
  fetchEvents: () => Promise<void>
  addEvent: (event: Event) => void
  updateEvent: (event: Event) => void
  deleteEvent: (eventId: string) => void
  setEvents: (events: Event[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  initializeRealtime: () => () => void
}

// ChatBot Store Types
export interface ChatBotStore {
  messages: ChatMessage[]
  isLoading: boolean
  pendingAttachments: ChatAttachment[]
  isUploading: boolean
  attachmentHistory: ChatAttachment[]
  config: ChatBotConfig
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  uploadFile: (file: File) => Promise<void>
  removeAttachment: (attachmentId: string) => void
  clearAttachments: () => void
  setUploading: (uploading: boolean) => void
  addToHistory: (attachment: ChatAttachment) => void
  removeFromHistory: (attachmentId: string) => void
  clearHistory: () => void
  updateConfig: (config: Partial<ChatBotConfig>) => void
  sendMessage: (content: string) => Promise<void>
  scrollToBottom: () => void
}

// Permissions Store Types
export interface PermissionsStore {
  user: User | null
  setUser: (user: User | null) => void
  canCreatePost: () => boolean
  canEditPost: (authorId: string) => boolean
  canDeletePost: (authorId: string) => boolean
  canCreateEvent: () => boolean
  canEditEvent: (authorId: string) => boolean
  canDeleteEvent: (authorId: string) => boolean
  canManageUsers: () => boolean
  canApproveUsers: () => boolean
  canAccessAdmin: () => boolean
  canModerateContent: () => boolean
  canViewAnalytics: () => boolean
  canManageSettings: () => boolean
  isAdmin: () => boolean
  isLeader: () => boolean
  isMember: () => boolean
  isApproved: () => boolean
}

// PWA Store Types
export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PWAStore {
  isInstallable: boolean
  installPrompt: PWAInstallPrompt | null
  isInstalled: boolean
  isStandalone: boolean
  notificationPermission: NotificationPermission
  isOnline: boolean
  setInstallable: (installable: boolean) => void
  setInstallPrompt: (prompt: PWAInstallPrompt | null) => void
  setInstalled: (installed: boolean) => void
  setStandalone: (standalone: boolean) => void
  setNotificationPermission: (permission: NotificationPermission) => void
  setOnline: (online: boolean) => void
  requestNotificationPermission: () => Promise<NotificationPermission>
  installApp: () => Promise<boolean>
  initializePWA: () => void
}
