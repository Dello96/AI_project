'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { ChatMessage, ChatBotConfig, ChatAttachment } from '@/types'
import { getGeminiService } from '@/lib/gemini'
import { supabase } from '@/lib/supabase'

interface ChatBotStore {
  // State
  messages: ChatMessage[]
  isLoading: boolean
  pendingAttachments: ChatAttachment[]
  isUploading: boolean
  attachmentHistory: ChatAttachment[]
  config: ChatBotConfig
  error: string | null
  
  // Actions
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
  toggleChat: () => void
  toggleMinimize: () => void
  handleFileSelect: (file: File) => Promise<void>
  handleFileRemove: (attachmentId: string) => void
  handleReattachFile: (attachment: ChatAttachment) => void
  handleRemoveFromHistory: (attachmentId: string) => void
  clearError: () => void
  setError: (error: string | null) => void
}

export const useChatBotStore = create<ChatBotStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: '샬롬! 오늘도 당신의 하루에 하나님과 동행하는 시간이 가득하길 바랍니다 궁금한게 있으시면 뭐든 말씀해주세요! 🙏✨',
        attachments: [],
        timestamp: new Date()
      }
    ],
    isLoading: false,
    pendingAttachments: [],
    isUploading: false,
    attachmentHistory: [],
    config: {
      isOpen: false,
      isMinimized: false,
      theme: 'light',
      position: 'bottom-right'
    },
    error: null,

    // Actions
    addMessage: (message) => {
      const newMessage: ChatMessage = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date()
      }
      
      set((state) => ({
        messages: [...state.messages, newMessage]
      }))
    },

    clearMessages: () => {
      set({ messages: [] })
    },

    setLoading: (loading) => {
      set({ isLoading: loading })
    },

    uploadFile: async (file: File) => {
      // 이미 업로드 중이면 중복 실행 방지
      if (get().isUploading) {
        return
      }
      
      // 타임아웃 설정 (30초)
      const timeoutId = setTimeout(() => {
        set({ isUploading: false, error: '파일 업로드 시간이 초과되었습니다.' })
      }, 30000)
      
      try {
        set({ isUploading: true, error: null })
        
        const formData = new FormData()
        formData.append('file', file)
        
        // 인증 토큰 가져오기
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        
        const headers: HeadersInit = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        const response = await fetch('/api/chat/upload', {
          method: 'POST',
          headers,
          body: formData
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || '파일 업로드에 실패했습니다.')
        }
        
        const data = await response.json()
        
        if (data.success && data.attachment) {
          set((state) => ({
            pendingAttachments: [...state.pendingAttachments, data.attachment]
          }))
        } else {
          throw new Error('파일 업로드 응답이 올바르지 않습니다.')
        }
      } catch (error) {
        console.error('파일 업로드 오류:', error)
        set({ error: error instanceof Error ? error.message : '파일 업로드에 실패했습니다.' })
        throw error
      } finally {
        clearTimeout(timeoutId)
        set({ isUploading: false })
      }
    },

    removeAttachment: (attachmentId) => {
      set((state) => ({
        pendingAttachments: state.pendingAttachments.filter(
          attachment => attachment.id !== attachmentId
        )
      }))
    },

    clearAttachments: () => {
      set({ pendingAttachments: [] })
    },

    setUploading: (uploading) => {
      set({ isUploading: uploading })
    },

    addToHistory: (attachment) => {
      set((state) => ({
        attachmentHistory: [...state.attachmentHistory, attachment]
      }))
    },

    removeFromHistory: (attachmentId) => {
      set((state) => ({
        attachmentHistory: state.attachmentHistory.filter(
          attachment => attachment.id !== attachmentId
        )
      }))
    },

    clearHistory: () => {
      set({ attachmentHistory: [] })
    },

    clearError: () => {
      set({ error: null })
    },

    setError: (error: string | null) => {
      set({ error })
    },

    updateConfig: (newConfig) => {
      set((state) => ({
        config: { ...state.config, ...newConfig }
      }))
    },

    sendMessage: async (content: string) => {
      const { pendingAttachments, addMessage, clearAttachments, setLoading, addToHistory } = get()
      
      try {
        setLoading(true)
        
        // 첨부파일을 먼저 히스토리에 추가
        pendingAttachments.forEach(attachment => {
          addToHistory(attachment)
        })
        
        // 사용자 메시지 추가
        addMessage({
          role: 'user',
          content,
          attachments: pendingAttachments
        })
        
        // 첨부파일 초기화
        clearAttachments()
        
        // Gemini API 호출
        const geminiService = getGeminiService()
        const messages = [
          {
            id: Date.now().toString(),
            role: 'user' as const,
            content,
            attachments: pendingAttachments,
            timestamp: new Date()
          }
        ]
        const response = await geminiService.sendMessage(messages)
        
        // AI 응답 추가
        addMessage({
          role: 'assistant',
          content: response,
          attachments: []
        })
        
      } catch (error) {
        console.error('메시지 전송 오류:', error)
        addMessage({
          role: 'assistant',
          content: '죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.',
          attachments: []
        })
      } finally {
        setLoading(false)
      }
    },

    scrollToBottom: () => {
      // 이 함수는 컴포넌트에서 직접 DOM을 조작해야 하므로
      // 실제 구현은 컴포넌트에서 처리
    },

    toggleChat: () => {
      set((state) => ({
        config: {
          ...state.config,
          isOpen: !state.config.isOpen
        }
      }))
    },

    toggleMinimize: () => {
      set((state) => ({
        config: {
          ...state.config,
          isMinimized: !state.config.isMinimized
        }
      }))
    },

    handleFileSelect: async (file: File) => {
      // 이미 업로드 중이면 무시
      if (get().isUploading) {
        return
      }
      
      try {
        await get().uploadFile(file)
      } catch (error) {
        console.error('파일 업로드 실패:', error)
        // 에러 상태는 uploadFile에서 이미 설정됨
      }
    },

    handleFileRemove: (attachmentId: string) => {
      get().removeAttachment(attachmentId)
    },

    handleReattachFile: (attachment: ChatAttachment) => {
      set((state) => ({
        pendingAttachments: [...state.pendingAttachments, attachment]
      }))
    },

    handleRemoveFromHistory: (attachmentId: string) => {
      get().removeFromHistory(attachmentId)
    }
  }))
)
