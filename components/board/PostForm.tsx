'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileUpload, FileWithPreview } from '@/components/ui/FileUpload'
import { postService } from '@/lib/database'
import { fileUploadService } from '@/lib/fileUpload'
import { useAuth } from '@/contexts/AuthContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  postFormSchema, 
  defaultPostFormData, 
  postCategoryOptions,
  type PostFormData 
} from '@/lib/post-schemas'

interface PostFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: Partial<PostFormData> | undefined
}

export default function PostForm({ isOpen, onClose, onSuccess, initialData }: PostFormProps) {
  const [attachedFiles, setAttachedFiles] = useState<FileWithPreview[]>([])
  const { user, isLoading: authLoading, refreshToken, signOut } = useAuth()
  const supabase = createClientComponentClient()
  
  // React Hook Form 설정
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      ...defaultPostFormData,
      ...initialData
    },
    mode: 'onChange'
  })
  
  const watchedValues = watch()

  const onSubmit = async (data: PostFormData) => {
    if (isSubmitting) return

    try {
      console.log('PostForm 제출 시도:', { 
        authLoading, 
        hasUser: !!user,
        userInfo: user ? { id: user.id, email: user.email } : null
      })
      
      // 인증 상태 확인
      if (authLoading) {
        console.log('인증 로딩 중...')
        alert('인증 상태를 확인하는 중입니다. 잠시만 기다려주세요.')
        return
      }
      
      if (!user) {
        console.log('사용자가 인증되지 않음')
        alert('로그인이 필요합니다. 먼저 로그인해주세요.')
        return
      }
      
      console.log('사용자 인증 상태 확인됨:', { 
        userId: user.id, 
        userEmail: user.email,
        isAuthenticated: !!user 
      })

      // 토큰 갱신 시도
      const tokenRefreshed = await refreshToken()
      if (!tokenRefreshed) {
        console.warn('토큰 갱신 실패, 기존 토큰으로 진행')
      }
      
      // 파일 업로드 처리
      let fileUrls: string[] = []
      if (attachedFiles.length > 0) {
        console.log('첨부파일 업로드 시작:', attachedFiles.length, '개 파일')
        console.log('첨부파일 정보:', attachedFiles.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        })))
        
        const uploadResult = await fileUploadService.uploadFiles(attachedFiles, 'posts')
        console.log('파일 업로드 결과:', uploadResult)
        
        if (uploadResult.success && uploadResult.files) {
          fileUrls = uploadResult.files.map(f => f.url)
          console.log('업로드된 파일 URL들:', fileUrls)
        } else {
          console.error('파일 업로드 실패:', uploadResult.error)
          alert(`파일 업로드에 실패했습니다: ${uploadResult.error}`)
          return
        }
      }

      // 익명 작성자 ID 생성 (임시)
      const anonymousAuthorId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // 최신 세션에서 토큰 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('세션 확인 오류:', sessionError)
        alert('인증 세션을 확인할 수 없습니다. 다시 로그인해주세요.')
        return
      }

      if (!session?.access_token) {
        console.error('액세스 토큰이 없습니다.')
        alert('인증 토큰이 없습니다. 다시 로그인해주세요.')
        return
      }

      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }

      console.log('게시글 작성 API 호출 시작...')
      console.log('사용자 ID:', user.id)
      console.log('토큰 존재:', !!session.access_token)

      // API 라우트 호출
      const response = await fetch('/api/board/posts', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          category: data.category,
          authorId: anonymousAuthorId,
          isAnonymous: true,
          attachments: fileUrls
        })
      })

      const result = await response.json()
      console.log('API 응답:', { status: response.status, result })

      if (response.ok && result.success) {
        console.log('게시글 작성 성공')
        onSuccess()
        onClose()
        reset()
        setAttachedFiles([])
      } else {
        console.error('게시글 작성 실패:', result.error)
        
        // 401 오류인 경우 특별 처리
        if (response.status === 401) {
          alert('인증이 만료되었습니다. 다시 로그인해주세요.')
          // 로그아웃 처리
          await signOut()
        } else {
          alert(result.error || '게시글 작성에 실패했습니다.')
        }
      }
    } catch (error) {
      console.error('게시글 작성 오류:', error)
      alert('게시글 작성 중 오류가 발생했습니다.')
    }
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
              <h2 className="text-2xl font-bold text-gray-900">게시글 작성</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 인증 상태 표시 */}
            {authLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">인증 상태를 확인하는 중...</span>
                </div>
              </div>
            ) : !user ? (
              <div className="text-center py-8">
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-lg font-medium mb-3">로그인이 필요합니다</p>
                  <p className="text-sm text-yellow-700 mb-4">
                    게시글을 작성하려면 먼저 로그인해주세요.
                  </p>
                  <div className="space-x-3">
                    <button
                      onClick={() => {
                        onClose()
                        window.location.href = '/login'
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      로그인하기
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">
                    ✅ {user.name}님으로 로그인되어 있습니다 ({user.email})
                  </p>
                </div>
              </div>
            )}

            {/* 폼 내용 - 인증된 사용자만 표시 */}
            {user && (
              <>
                {/* 폼 */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 카테고리 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <div className="flex gap-2 flex-wrap">
                  {postCategoryOptions.map((category) => (
                    <Button
                      key={category.value}
                      type="button"
                      variant={watchedValues.category === category.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setValue('category', category.value)}
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
                {errors.category && (
                  <p className="mt-2 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <Input
                  type="text"
                  placeholder="제목을 입력하세요"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  placeholder="내용을 입력하세요"
                  {...register('content')}
                  rows={8}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 border-neutral-200 focus:border-primary-500 focus:ring-primary-100"
                />
                {errors.content && (
                  <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>

              {/* 파일 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  첨부 파일
                </label>
                <FileUpload
                  onFilesChange={setAttachedFiles}
                  maxFiles={5}
                  maxSize={10}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
              </div>

              {/* 익명 안내 */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 모든 게시글은 익명으로 작성됩니다.
                </p>
              </div>

              {/* 에러 메시지 */}
              {(errors.title || errors.content || errors.category) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    입력한 정보를 다시 확인해주세요.
                  </p>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '작성 중...' : '작성하기'}
                </Button>
              </div>
                </form>
              </>
            )}

          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
