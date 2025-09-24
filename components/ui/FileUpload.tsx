'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CloudArrowUpIcon, 
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline'
import { Button } from './Button'

export interface FileWithPreview {
  preview?: string
  id: string
  size: number
  type: string
  name: string
  lastModified: number
  webkitRelativePath: string
  file: File // 원본 File 객체 저장
}

interface FileUploadProps {
  onFilesChange: (files: FileWithPreview[]) => void
  maxFiles?: number
  maxSize?: number // MB
  accept?: string
  className?: string
}

const getFileIcon = (file: File) => {
  if (file.type && file.type.startsWith('image/')) return PhotoIcon
  if (file.type && file.type.startsWith('video/')) return VideoCameraIcon
  if (file.type && file.type.startsWith('audio/')) return MusicalNoteIcon
  return DocumentIcon
}

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  maxFiles = 5,
  maxSize = 10, // 10MB
  accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt',
  className = ''
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string>('')

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `파일 크기가 ${maxSize}MB를 초과합니다.`
    }
    return null
  }

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const validFiles: FileWithPreview[] = []
    const errors: string[] = []

    console.log('파일 추가 시작:', fileArray.length, '개 파일')

    fileArray.forEach((file, index) => {
      console.log(`파일 ${index + 1} 정보:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })

      const validationError = validateFile(file)
      if (validationError) {
        console.error(`파일 ${file.name} 검증 실패:`, validationError)
        errors.push(`${file.name}: ${validationError}`)
        return
      }

      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`최대 ${maxFiles}개 파일만 업로드할 수 있습니다.`)
        return
      }

      const fileWithPreview: FileWithPreview = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name || 'unknown',
        size: file.size || 0,
        type: file.type || 'application/octet-stream',
        lastModified: file.lastModified || Date.now(),
        webkitRelativePath: file.webkitRelativePath || '',
        file: file // 원본 File 객체 저장
      }

      console.log('FileWithPreview 생성:', {
        id: fileWithPreview.id,
        name: fileWithPreview.name,
        size: fileWithPreview.size,
        type: fileWithPreview.type,
        originalFileSize: file.size,
        originalFileType: file.type
      })

      if (file.type && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => {
          fileWithPreview.preview = reader.result as string
          console.log('이미지 미리보기 생성 완료:', fileWithPreview.name)
        }
        reader.readAsDataURL(file)
      }

      validFiles.push(fileWithPreview)
    })

    if (errors.length > 0) {
      setError(errors.join('\n'))
      setTimeout(() => setError(''), 5000)
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles]
      setFiles(updatedFiles)
      onFilesChange(updatedFiles)
    }
  }, [files, maxFiles, maxSize, onFilesChange])

  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }, [files, onFilesChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files)
    }
  }, [addFiles])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 드래그 앤 드롭 영역 */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-900">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-gray-500 mt-1">
              최대 {maxFiles}개 파일, 각 {maxSize}MB까지
            </p>
          </div>
        </div>
      </motion.div>

      {/* 에러 메시지 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <p className="text-red-800 text-sm whitespace-pre-line">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 파일 목록 */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">업로드된 파일 ({files.length}/{maxFiles})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* 썸네일 영역 */}
                <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {React.createElement(getFileIcon(file.file), { className: 'w-12 h-12 text-gray-400' })}
                    </div>
                  )}
                </div>
                
                {/* 파일 정보 */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {file.size && file.size > 0 ? formatFileSize(file.size) : `크기 정보 없음 (${file.size})`}
                  </p>
                  {file.type && file.type !== 'undefined' && (
                    <p className="text-xs text-gray-400 capitalize">
                      {file.type.split('/')[0] || 'Unknown'}
                    </p>
                  )}
                </div>
                
                {/* 삭제 버튼 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 p-1 rounded-full shadow-sm"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
