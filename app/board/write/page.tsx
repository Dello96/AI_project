'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { 
  ArrowLeftIcon, 
  EyeIcon, 
  EyeSlashIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileUpload, FileWithPreview } from '@/components/ui/FileUpload'
import { 
  postFormSchema, 
  defaultPostFormData, 
  postCategoryOptions,
  type PostFormData 
} from '@/lib/post-schemas'
import Link from 'next/link'

export default function WritePostPage() {
  const router = useRouter()
  const [attachedFiles, setAttachedFiles] = useState<FileWithPreview[]>([])
  const [showPreview, setShowPreview] = useState(false)
  
  // React Hook Form 설정
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(postFormSchema),
    defaultValues: defaultPostFormData,
    mode: 'onChange'
  })
  
  const watchedValues = watch()
  
  
  const onSubmit = async (data: PostFormData) => {
    try {
      // 익명 작성자 ID 생성
      const anonymousAuthorId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // 파일 업로드 처리
      let fileUrls: string[] = []
      if (attachedFiles.length > 0) {
        // TODO: 실제 파일 업로드 로직 구현
        fileUrls = attachedFiles.map(f => f.name)
      }
      
      // API 호출
      const response = await fetch('/api/board/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          authorId: anonymousAuthorId,
          isAnonymous: true, // 항상 익명으로 작성
          attachments: fileUrls
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '게시글 작성에 실패했습니다.')
      }
      
      // 성공 시 게시판 목록으로 이동
      router.push('/board')
      
    } catch (error) {
      console.error('게시글 작성 오류:', error)
      // 에러는 React Hook Form의 setError로 처리
    }
  }
  
  const handleFileChange = (files: FileWithPreview[]) => {
    setAttachedFiles(files)
  }
  
  const getCategoryColor = (category: string) => {
    const categoryOption = postCategoryOptions.find(c => c.value === category)
    return categoryOption ? `${categoryOption.color.replace('bg-', 'bg-').replace('-500', '-100')} text-${categoryOption.color.replace('bg-', '').replace('-500', '-800')}` : 'bg-gray-100 text-gray-800'
  }
  
  const getCategoryLabel = (category: string) => {
    return postCategoryOptions.find(c => c.value === category)?.label || category
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/board">
                <Button variant="outline" size="sm">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  목록으로
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">게시글 작성</h1>
                <p className="text-sm text-gray-600">새로운 이야기를 공유해보세요</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <EyeSlashIcon className="w-4 h-4 mr-2" />
                    편집
                  </>
                ) : (
                  <>
                    <EyeIcon className="w-4 h-4 mr-2" />
                    미리보기
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* 카테고리 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  카테고리 선택
                </label>
                <div className="flex gap-3 flex-wrap">
                  {postCategoryOptions.map((category) => (
                    <Button
                      key={category.value}
                      type="button"
                      variant={watchedValues.category === category.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setValue('category', category.value)}
                      className="min-w-[80px]"
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
                {errors.category && (
                  <p className="mt-2 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>
              
              {/* 제목 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  제목 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="제목을 입력하세요 (2자 이상)"
                  {...register('title')}
                  className="text-lg"
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {watchedValues.title?.length || 0}/100
                  </span>
                  {errors.title && (
                    <span className="text-xs text-red-500">
                      {errors.title.message}
                    </span>
                  )}
                </div>
              </div>
              
              {/* 내용 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="내용을 입력하세요 (10자 이상)"
                  {...register('content')}
                  rows={12}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={5000}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {watchedValues.content?.length || 0}/5000
                  </span>
                  {errors.content && (
                    <span className="text-xs text-red-500">
                      {errors.content.message}
                    </span>
                  )}
                </div>
              </div>
              
              {/* 파일 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  첨부 파일
                </label>
                <FileUpload
                  onFilesChange={handleFileChange}
                  maxFiles={5}
                  maxSize={10}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
                <p className="text-xs text-gray-500 mt-2">
                  최대 5개 파일, 각 파일 10MB 이하
                </p>
              </div>
              
              {/* 익명/실명 선택 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  작성자 표시 방식
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      {...register('isAnonymous')}
                      value="true"
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">익명으로 작성</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      {...register('isAnonymous')}
                      value="false"
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">실명으로 작성</span>
                  </label>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    💡 실명으로 작성하면 회원 이름이 표시됩니다.
                  </p>
                </div>
              </div>
              
              {/* 미리보기 */}
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border border-gray-200 rounded-lg p-6 bg-gray-50"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">미리보기</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(watchedValues.category || 'free')}`}>
                        {getCategoryLabel(watchedValues.category || 'free')}
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900">
                      {watchedValues.title || '제목을 입력하세요'}
                    </h2>
                    
                    <div className="text-sm text-gray-500">
                      작성자: 익명 | 
                      작성일: {new Date().toLocaleDateString('ko-KR')}
                    </div>
                    
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap text-gray-700">
                        {watchedValues.content || '내용을 입력하세요'}
                      </p>
                    </div>
                    
                    {attachedFiles.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">첨부 파일</h4>
                        <div className="flex gap-2 flex-wrap">
                          {attachedFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
                              {file.type.startsWith('image/') ? (
                                <PhotoIcon className="w-4 h-4 text-blue-500" />
                              ) : (
                                <DocumentIcon className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="text-sm text-gray-700">{file.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              
              {/* 에러 메시지 */}
              {(errors.title || errors.content || errors.category) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-600">
                    입력한 정보를 다시 확인해주세요.
                  </p>
                </motion.div>
              )}
              
              {/* 버튼 */}
              <div className="flex gap-4 justify-end pt-6 border-t">
                <Link href="/board">
                  <Button variant="outline" disabled={isSubmitting}>
                    취소
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      작성 중...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                      게시글 작성
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
