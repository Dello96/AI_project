'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { PostForm as PostFormType, postCategories } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileUpload, FileWithPreview } from '@/components/ui/FileUpload'
import { useAuth } from '@/hooks/useAuth'
import { postService } from '@/lib/database'
import { fileUploadService } from '@/lib/fileUpload'

interface PostFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: Partial<PostFormType> | undefined
}

export default function PostForm({ isOpen, onClose, onSuccess, initialData }: PostFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<PostFormType>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    category: (initialData?.category as 'notice' | 'free' | 'qna') || 'free',
    isAnonymous: initialData?.isAnonymous || false
  })
  const [attachedFiles, setAttachedFiles] = useState<FileWithPreview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('제목과 내용을 입력해주세요.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // 파일 업로드 처리
      let fileUrls: string[] = []
      if (attachedFiles.length > 0) {
        const uploadResult = await fileUploadService.uploadFiles(attachedFiles, 'posts')
        if (uploadResult.success && uploadResult.files) {
          fileUrls = uploadResult.files.map(f => f.url)
        } else {
          setError('파일 업로드에 실패했습니다.')
          return
        }
      }

      const result = await postService.createPost({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category as 'notice' | 'free' | 'qna',
        authorId: user.id,
        isAnonymous: formData.isAnonymous,
        attachments: fileUrls
      })

      if (result) {
        onSuccess()
        onClose()
        setFormData({ title: '', content: '', category: 'free', isAnonymous: false })
        setAttachedFiles([])
      } else {
        setError('게시글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('게시글 작성 오류:', error)
      setError('게시글 작성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof PostFormType, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <CardContent className="p-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-secondary-900">게시글 작성</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 카테고리 선택 */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  카테고리
                </label>
                <div className="flex gap-2 flex-wrap">
                  {postCategories.map((category) => (
                    <Button
                      key={category.value}
                      type="button"
                      variant={formData.category === category.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleInputChange('category', category.value)}
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  제목
                </label>
                <Input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  내용
                </label>
                <textarea
                  placeholder="내용을 입력하세요"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  required
                  rows={8}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 border-neutral-200 focus:border-primary-500 focus:ring-primary-100"
                />
              </div>

              {/* 파일 업로드 */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  첨부 파일
                </label>
                <FileUpload
                  onFilesChange={setAttachedFiles}
                  maxFiles={5}
                  maxSize={10}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
              </div>

              {/* 익명 설정 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isAnonymous" className="text-sm text-secondary-700">
                  익명으로 작성
                </label>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  작성하기
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
