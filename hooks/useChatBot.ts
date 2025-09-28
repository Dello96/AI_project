'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ChatMessage, ChatBotConfig, ChatAttachment } from '@/types'
import { getGeminiService } from '@/lib/gemini'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

export function useChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [attachmentHistory, setAttachmentHistory] = useState<ChatAttachment[]>([])
  const [config, setConfig] = useState<ChatBotConfig>({
    isOpen: false,
    isMinimized: false,
    theme: 'light',
    position: 'bottom-right'
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const geminiService = getGeminiService()
  const { user } = useAuthStore()

  // 메시지 목록 스크롤을 맨 아래로
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // 새 메시지 추가
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, newMessage])
  }, [])

  // 파일 업로드
  const uploadFile = useCallback(async (file: File): Promise<ChatAttachment | null> => {
    setIsUploading(true)
    
    try {
      // 사용자 인증 확인
      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      // Supabase 세션에서 액세스 토큰 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('인증 토큰을 가져올 수 없습니다.')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '파일 업로드에 실패했습니다.')
      }

      return data.attachment
    } catch (error) {
      console.error('파일 업로드 오류:', error)
      return null
    } finally {
      setIsUploading(false)
    }
  }, [user])

  // 파일 선택 처리
  const handleFileSelect = useCallback(async (file: File) => {
    const attachment = await uploadFile(file)
    if (attachment) {
      setPendingAttachments(prev => [...prev, attachment])
    }
  }, [uploadFile])

  // 파일 제거
  const handleFileRemove = useCallback((fileId: string) => {
    setPendingAttachments(prev => prev.filter(attachment => attachment.id !== fileId))
  }, [])

  // 히스토리에서 파일 다시 첨부
  const handleReattachFile = useCallback((attachment: ChatAttachment) => {
    // 이미 첨부된 파일인지 확인
    const isAlreadyAttached = pendingAttachments.some(pending => pending.id === attachment.id)
    
    if (!isAlreadyAttached) {
      setPendingAttachments(prev => [...prev, attachment])
    }
  }, [pendingAttachments])

  // 히스토리에서 파일 제거
  const handleRemoveFromHistory = useCallback((fileId: string) => {
    setAttachmentHistory(prev => prev.filter(attachment => attachment.id !== fileId))
  }, [])

  // 사용자 메시지 전송
  const sendMessage = useCallback(async (content: string) => {
    if ((!content.trim() && pendingAttachments.length === 0) || isLoading) return

    // 현재 첨부파일들을 임시 저장 (초기화 전에)
    const currentAttachments = [...pendingAttachments]

    // 첨부파일이 있으면 히스토리에 추가
    if (currentAttachments.length > 0) {
      setAttachmentHistory(prev => {
        const newAttachments = currentAttachments.filter(
          newAttachment => !prev.some(existing => existing.id === newAttachment.id)
        )
        return [...prev, ...newAttachments]
      })
    }

    // 사용자 메시지 생성 (저장된 첨부파일 사용)
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }
    
    if (currentAttachments.length > 0) {
      userMessage.attachments = [...currentAttachments]
    }

    // 첨부파일 즉시 초기화 (UI에서 사라지도록)
    setPendingAttachments([])
    setIsLoading(true)

    try {
      // 메시지 목록에 사용자 메시지 추가
      setMessages(prev => {
        const updatedMessages = [...prev, userMessage]
        
        // Gemini API 호출 (첨부파일 정보 포함)
        geminiService.sendMessage(updatedMessages).then(response => {
          console.log('챗봇 응답 받음:', response)
          
          // AI 응답 추가
          addMessage({
            role: 'assistant',
            content: response
          })
        }).catch(error => {
          console.error('메시지 전송 오류:', error)
          addMessage({
            role: 'assistant',
            content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          })
        }).finally(() => {
          setIsLoading(false)
        })
        
        return updatedMessages
      })

      console.log('챗봇 메시지 전송 중...', { 
        messageCount: messages.length + 1,
        hasAttachments: currentAttachments.length > 0
      })
    } catch (error) {
      console.error('메시지 전송 오류:', error)
      addMessage({
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      })
      setIsLoading(false)
    }
  }, [messages, isLoading, addMessage, pendingAttachments])

  // 챗봇 열기/닫기
  const toggleChat = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
      isMinimized: false
    }))
  }, [])

  // 챗봇 최소화/복원
  const toggleMinimize = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized
    }))
  }, [])

  // 메시지 목록 초기화
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // 챗봇 열릴 때 인사말 추가
  useEffect(() => {
    if (config.isOpen && messages.length === 0) {
      geminiService.generateGreeting().then(greeting => {
        addMessage({
          role: 'assistant',
          content: greeting
        })
      })
    }
  }, [config.isOpen, messages.length, addMessage])

  // 새 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  return {
    messages,
    isLoading,
    isUploading,
    pendingAttachments,
    attachmentHistory,
    config,
    messagesEndRef,
    sendMessage,
    handleFileSelect,
    handleFileRemove,
    handleReattachFile,
    handleRemoveFromHistory,
    toggleChat,
    toggleMinimize,
    clearMessages,
    setConfig
  }
}
