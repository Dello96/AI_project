'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2, 
  Send, 
  Bot,
  User,
  Trash2
} from 'lucide-react'
import { useChatBot } from '@/hooks/useChatBot'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function ChatBot() {
  const [inputValue, setInputValue] = useState('')
  const {
    messages,
    isLoading,
    config,
    messagesEndRef,
    sendMessage,
    toggleChat,
    toggleMinimize,
    clearMessages
  } = useChatBot()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue)
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <>
      {/* 챗봇 토글 버튼 */}
      <AnimatePresence>
        {!config.isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`fixed ${config.position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'} z-[9999]`}
          >
            <Button
              onClick={toggleChat}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-2xl hover:scale-110 transition-all duration-300"
              size="lg"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 챗봇 패널 */}
      <AnimatePresence>
        {config.isOpen && (
          <motion.div
            initial={{ 
              scale: 0.8, 
              opacity: 0,
              y: 20
            }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              y: 0
            }}
            exit={{ 
              scale: 0.8, 
              opacity: 0,
              y: 20
            }}
            className={`fixed ${config.position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'} z-[9999]`}
          >
            <Card className="w-80 h-96 bg-gradient-to-br from-gray-900 to-black shadow-2xl border border-orange-500/30 flex flex-col">
              {/* 헤더 - 인터파크 스타일 */}
              <div className="flex items-center justify-between p-4 border-b border-orange-500/30 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  <span className="font-semibold">PrayGround AI</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={toggleMinimize}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-black/20 p-1 transition-all duration-300"
                  >
                    {config.isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={clearMessages}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-black/20 p-1 transition-all duration-300"
                    title="대화 초기화"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={toggleChat}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-black/20 p-1 transition-all duration-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 메시지 영역 - 다크 테마 */}
              {!config.isMinimized && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-800 to-gray-900">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`flex items-start gap-2 max-w-[80%] ${
                          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                            : 'bg-gradient-to-r from-gray-600 to-gray-700 text-orange-400'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                        <div
                          className={`px-4 py-3 rounded-lg shadow-lg ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                              : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100 border border-gray-600'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* 로딩 인디케이터 */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 text-orange-400 flex items-center justify-center shadow-lg">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100 px-4 py-3 rounded-lg shadow-lg border border-gray-600">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* 입력 영역 - 다크 테마 */}
              {!config.isMinimized && (
                <div className="p-4 border-t border-orange-500/30 bg-gray-800">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="메시지를 입력하세요..."
                      disabled={isLoading}
                      className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
                    />
                    <Button
                      type="submit"
                      disabled={!inputValue.trim() || isLoading}
                      size="sm"
                      className="px-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-none"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
