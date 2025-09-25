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
  Trash2,
  Image as ImageIcon,
  FileText,
  File
} from 'lucide-react'
import { useChatBot } from '@/hooks/useChatBot'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import ChatFileUpload from './ChatFileUpload'

export default function ChatBot() {
  const [inputValue, setInputValue] = useState('')
  const { user } = useAuth()
  const {
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
    clearMessages
  } = useChatBot()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((inputValue.trim() || pendingAttachments.length > 0) && !isLoading && !isUploading) {
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
            <Card className="w-96 h-[32rem] bg-gradient-to-br from-gray-900 to-black shadow-2xl border border-orange-500/30 flex flex-col">
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
                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-gray-800 to-gray-900">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`flex items-start gap-3 max-w-[85%] ${
                          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                            : 'bg-gradient-to-r from-gray-600 to-gray-700 text-orange-400'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="w-5 h-5" />
                          ) : (
                            <Bot className="w-5 h-5" />
                          )}
                        </div>
                        <div
                          className={`px-5 py-4 rounded-lg shadow-lg ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                              : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100 border border-gray-600'
                          }`}
                        >
                          {/* 첨부파일 표시 */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mb-3 space-y-2">
                              {message.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-black/20 rounded border border-white/20">
                                  {attachment.thumbnailUrl && attachment.mimeType.startsWith('image/') ? (
                                    <img
                                      src={attachment.thumbnailUrl}
                                      alt={attachment.originalName}
                                      className="w-8 h-8 object-cover rounded border border-white/30"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-white/20 rounded border border-white/30 flex items-center justify-center">
                                      {attachment.mimeType.startsWith('image/') ? (
                                        <ImageIcon className="w-4 h-4" />
                                      ) : attachment.mimeType === 'application/pdf' ? (
                                        <FileText className="w-4 h-4" />
                                      ) : (
                                        <File className="w-4 h-4" />
                                      )}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{attachment.originalName}</p>
                                    <p className="text-xs opacity-70">
                                      {(attachment.size / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <p className="text-sm opacity-70 mt-3">
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
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 text-orange-400 flex items-center justify-center shadow-lg">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100 px-5 py-4 rounded-lg shadow-lg border border-gray-600">
                          <div className="flex space-x-2">
                            <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
                <div className="p-6 border-t border-orange-500/30 bg-gray-800">
                  {/* 파일 업로드 영역 */}
                  <div className="mb-4">
                    <ChatFileUpload
                      onFileSelect={handleFileSelect}
                      onFileRemove={handleFileRemove}
                      onReattachFile={handleReattachFile}
                      onRemoveFromHistory={handleRemoveFromHistory}
                      attachments={pendingAttachments}
                      attachmentHistory={attachmentHistory}
                      isLoading={isUploading}
                      isAuthenticated={!!user}
                    />
                  </div>
                  
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="메시지를 입력하세요..."
                      disabled={isLoading || isUploading}
                      className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 text-base py-3"
                    />
                    <Button
                      type="submit"
                      disabled={(!inputValue.trim() && pendingAttachments.length === 0) || isLoading || isUploading}
                      size="lg"
                      className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-none"
                    >
                      <Send className="w-5 h-5" />
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
