'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Paperclip, 
  X, 
  Image as ImageIcon, 
  FileText, 
  File,
  Upload,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ChatAttachment } from '@/types'

interface ChatFileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove: (fileId: string) => void
  onReattachFile: (attachment: ChatAttachment) => void
  onRemoveFromHistory: (fileId: string) => void
  attachments: ChatAttachment[]
  attachmentHistory: ChatAttachment[]
  isLoading?: boolean
  isUploading?: boolean
  isAuthenticated?: boolean
}

export default function ChatFileUpload({ 
  onFileSelect, 
  onFileRemove, 
  onReattachFile,
  onRemoveFromHistory,
  attachments, 
  attachmentHistory,
  isLoading = false,
  isUploading = false,
  isAuthenticated = true
}: ChatFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    setUploadError(null)
    
    // 이미 업로드 중이면 무시
    if (isUploading) {
      return
    }
    
    // 인증 상태 확인
    if (!isAuthenticated) {
      setUploadError('파일 업로드를 위해서는 로그인이 필요합니다.')
      return
    }
    
    // 파일 크기 체크 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError('파일 크기는 10MB를 초과할 수 없습니다.')
      return
    }

    // 파일 타입 체크
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      setUploadError('지원되지 않는 파일 형식입니다. 이미지, PDF, 텍스트 파일만 업로드 가능합니다.')
      return
    }

    onFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0]) {
      handleFileSelect(files[0]) // 첫 번째 파일만 처리
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-4 h-4" />
    } else {
      return <File className="w-4 h-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-2">
      {/* 파일 첨부 버튼 - 작은 크기 */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              setUploadError('파일 업로드를 위해서는 로그인이 필요합니다.')
              return
            }
            
            if (isUploading) {
              return
            }
            
            if (fileInputRef.current) {
              fileInputRef.current.click()
            }
          }}
          disabled={isLoading || isUploading}
          size="sm"
          variant="outline"
          className={`px-2 py-1 h-7 ${
            isAuthenticated 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 hover:text-white' 
              : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
          }`}
        >
          <Paperclip className="w-3 h-3 mr-1" />
          <span className="text-xs">
            {isUploading ? '업로드 중...' : isAuthenticated ? '첨부' : '로그인 필요'}
          </span>
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          className="hidden"
          accept="image/*,.pdf,.txt,.doc,.docx"
        />
      </div>

      {/* 드래그 앤 드롭 영역 - 매우 컴팩트 버전 */}
      <div
        className={`border border-dashed rounded p-1.5 transition-all duration-200 ${
          !isAuthenticated
            ? 'border-gray-700 bg-gray-800/30 cursor-not-allowed'
            : isDragOver 
              ? 'border-orange-500 bg-orange-500/10' 
              : 'border-gray-600 bg-gray-800/30'
        }`}
        onDragOver={isAuthenticated ? handleDragOver : undefined}
        onDragLeave={isAuthenticated ? handleDragLeave : undefined}
        onDrop={isAuthenticated ? handleDrop : undefined}
      >
        <div className="text-center">
          <Upload className={`w-3 h-3 mx-auto mb-0.5 ${isAuthenticated ? 'text-gray-400' : 'text-gray-600'}`} />
          <p className={`text-xs ${isAuthenticated ? 'text-gray-400' : 'text-gray-600'}`}>
            {isAuthenticated ? '드래그하거나 클릭' : '로그인 필요'}
          </p>
          {isAuthenticated && (
            <p className="text-xs text-gray-500">
              최대 10MB
            </p>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 bg-red-900/50 border border-red-500/50 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-300">{uploadError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 첨부된 파일 목록 - 매우 컴팩트 버전 */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            <p className="text-xs text-gray-400 font-medium">첨부:</p>
            {attachments.map((attachment) => (
              <motion.div
                key={attachment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-1.5 p-1.5 bg-gray-700/50 rounded border border-gray-600"
              >
                {/* 파일 썸네일/아이콘 - 매우 작은 크기 */}
                <div className="flex-shrink-0">
                  {attachment.thumbnailUrl && attachment.mimeType.startsWith('image/') ? (
                    <img
                      src={attachment.thumbnailUrl}
                      alt={attachment.originalName}
                      className="w-4 h-4 object-cover rounded border border-gray-600"
                    />
                  ) : (
                    <div className="w-4 h-4 bg-gray-600 rounded border border-gray-500 flex items-center justify-center">
                      {getFileIcon(attachment.mimeType)}
                    </div>
                  )}
                </div>

                {/* 파일 정보 - 매우 작은 텍스트 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">
                    {attachment.originalName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>

                {/* 삭제 버튼 */}
                <Button
                  onClick={() => onFileRemove(attachment.id)}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 첨부 파일 히스토리 - 매우 컴팩트 버전 */}
      <AnimatePresence>
        {attachmentHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            <p className="text-xs text-gray-400 font-medium">이전:</p>
            <div className="max-h-16 overflow-y-auto space-y-0.5">
              {attachmentHistory.map((attachment) => {
                const isAlreadyAttached = attachments.some(pending => pending.id === attachment.id)
                
                return (
                  <motion.div
                    key={attachment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`flex items-center gap-1 p-1 rounded border transition-all duration-200 ${
                      isAlreadyAttached 
                        ? 'bg-orange-500/20 border-orange-500/50' 
                        : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50 cursor-pointer'
                    }`}
                    onClick={() => !isAlreadyAttached && onReattachFile(attachment)}
                  >
                    {/* 파일 썸네일/아이콘 - 극소 크기 */}
                    <div className="flex-shrink-0">
                      {attachment.thumbnailUrl && attachment.mimeType.startsWith('image/') ? (
                        <img
                          src={attachment.thumbnailUrl}
                          alt={attachment.originalName}
                          className="w-3 h-3 object-cover rounded border border-gray-600"
                        />
                      ) : (
                        <div className="w-3 h-3 bg-gray-600 rounded border border-gray-500 flex items-center justify-center">
                          {getFileIcon(attachment.mimeType)}
                        </div>
                      )}
                    </div>

                    {/* 파일 정보 - 극소 텍스트 */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${
                        isAlreadyAttached ? 'text-orange-300' : 'text-gray-300'
                      }`}>
                        {attachment.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>

                    {/* 액션 버튼들 - 극소 크기 */}
                    <div className="flex items-center gap-0.5">
                      {!isAlreadyAttached && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            onReattachFile(attachment)
                          }}
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-orange-400 hover:bg-orange-900/20 p-0.5"
                          title="다시 첨부"
                        >
                          <Paperclip className="w-2 h-2" />
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveFromHistory(attachment.id)
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 p-0.5"
                        title="히스토리에서 제거"
                      >
                        <X className="w-2 h-2" />
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
