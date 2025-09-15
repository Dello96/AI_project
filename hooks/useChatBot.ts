'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ChatMessage, ChatBotConfig } from '@/types'
import { getOpenAIService } from '@/lib/openai'

export function useChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<ChatBotConfig>({
    isOpen: false,
    isMinimized: false,
    theme: 'light',
    position: 'bottom-right'
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const openaiService = getOpenAIService()

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

  // 사용자 메시지 전송
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    // 사용자 메시지 추가
    addMessage({
      role: 'user',
      content: content.trim()
    })

    setIsLoading(true)

    try {
      // 현재 메시지 목록에 사용자 메시지 추가
      const currentMessages = [...messages, {
        id: Date.now().toString(),
        role: 'user' as const,
        content: content.trim(),
        timestamp: new Date()
      }]

      // OpenAI API 호출
      const response = await openaiService.sendMessage(currentMessages)
      
      // AI 응답 추가
      addMessage({
        role: 'assistant',
        content: response
      })
    } catch (error) {
      console.error('메시지 전송 오류:', error)
      addMessage({
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      })
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, addMessage])

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
      openaiService.generateGreeting().then(greeting => {
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
    config,
    messagesEndRef,
    sendMessage,
    toggleChat,
    toggleMinimize,
    clearMessages,
    setConfig
  }
}
