import { supabase, createServerSupabaseClient } from './supabase'
import { FileWithPreview } from '@/components/ui/FileUpload'

// FileWithPreview에서 원본 File 객체를 가져오는 헬퍼 함수
function getFileFromPreview(filePreview: FileWithPreview): File {
  return filePreview.file
}

export interface UploadedFile {
  id: string
  name: string
  url: string
  size: number
  type: string
  bucket: string
  path: string
}

export interface FileUploadResult {
  success: boolean
  files?: UploadedFile[]
  error?: string
}

class FileUploadService {
  private bucket = 'posting-image'

  /**
   * 파일을 Supabase Storage에 업로드
   */
  async uploadFiles(files: FileWithPreview[], folder: string = 'general'): Promise<FileUploadResult> {
    try {
      console.log('파일 업로드 시작:', { files: files.length, folder, bucket: this.bucket })
      
      // 먼저 일반 클라이언트로 시도
      let supabaseClient = supabase
      let useServiceRole = false
      
      // Supabase 인증 상태 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Supabase 세션 상태:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        sessionError: sessionError?.message,
        accessToken: session?.access_token ? '있음' : '없음'
      })
      
      if (sessionError || !session || !session.user) {
        console.log('일반 클라이언트 인증 실패, Service Role Key 사용 시도')
        useServiceRole = true
        supabaseClient = createServerSupabaseClient()
      } else {
        // 토큰 만료 확인 및 갱신 시도
        const now = Math.floor(Date.now() / 1000)
        const tokenExpiry = session.expires_at
        if (tokenExpiry && now >= tokenExpiry) {
          console.log('토큰이 만료되었습니다. 갱신을 시도합니다.')
          
          // 토큰 갱신 시도
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError || !refreshData.session) {
            console.log('토큰 갱신 실패, Service Role Key 사용 시도')
            useServiceRole = true
            supabaseClient = createServerSupabaseClient()
          } else {
            console.log('토큰 갱신 성공')
          }
        }
      }
      
      if (useServiceRole) {
        console.log('Service Role Key를 사용하여 파일 업로드 시도')
      }
      
      const uploadedFiles: UploadedFile[] = []
      
      for (const filePreview of files) {
        console.log('개별 파일 정보:', {
          name: filePreview.name,
          size: filePreview.size,
          type: filePreview.type,
          lastModified: filePreview.lastModified
        })
        
        // 원본 File 객체 가져오기
        const file = getFileFromPreview(filePreview)
        console.log('원본 File 객체:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        })
        
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`
        const filePath = `${folder}/${fileName}`
        
        console.log('업로드 경로:', filePath)
        
        console.log('Supabase Storage 업로드 시도:', {
          bucket: this.bucket,
          filePath,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        })

        const { data, error } = await supabaseClient.storage
          .from(this.bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('파일 업로드 오류 상세:', {
            error,
            message: error.message,
            statusCode: (error as any).statusCode || 'unknown',
            errorCode: (error as any).error || 'unknown',
            bucket: this.bucket,
            filePath
          })
          return {
            success: false,
            error: `파일 ${file.name} 업로드 실패: ${error.message} (코드: ${(error as any).error || 'unknown'})`
          }
        }

        console.log('업로드 성공:', data)

        // 공개 URL 생성
        const { data: urlData } = supabaseClient.storage
          .from(this.bucket)
          .getPublicUrl(filePath)

        console.log('공개 URL 생성:', urlData)

        const uploadedFile = {
          id: data.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url: urlData.publicUrl,
          size: file.size || 0,
          type: file.type || 'application/octet-stream',
          bucket: this.bucket,
          path: filePath
        }
        
        console.log('최종 업로드된 파일 정보:', uploadedFile)
        uploadedFiles.push(uploadedFile)
      }

      return {
        success: true,
        files: uploadedFiles
      }
    } catch (error) {
      console.error('파일 업로드 서비스 오류:', error)
      return {
        success: false,
        error: '파일 업로드 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * 파일 삭제
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([filePath])

      if (error) {
        console.error('파일 삭제 오류:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('파일 삭제 서비스 오류:', error)
      return false
    }
  }

  /**
   * 여러 파일 삭제
   */
  async deleteFiles(filePaths: string[]): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove(filePaths)

      if (error) {
        console.error('파일들 삭제 오류:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('파일들 삭제 서비스 오류:', error)
      return false
    }
  }

  /**
   * 파일 목록 조회
   */
  async listFiles(folder: string = 'general'): Promise<UploadedFile[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .list(folder)

      if (error) {
        console.error('파일 목록 조회 오류:', error)
        return []
      }

      return data.map(file => ({
        id: file.id,
        name: file.name,
        url: '', // URL은 별도로 생성해야 함
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || '',
        bucket: this.bucket,
        path: `${folder}/${file.name}`
      }))
    } catch (error) {
      console.error('파일 목록 조회 서비스 오류:', error)
      return []
    }
  }

  /**
   * 파일 크기 검증
   */
  validateFileSize(file: File, maxSizeMB: number): boolean {
    return file.size <= maxSizeMB * 1024 * 1024
  }

  /**
   * 파일 타입 검증
   */
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })
  }

  /**
   * 이미지 리사이징 (클라이언트 사이드)
   */
  async resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 600): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        let { width, height } = img

        // 비율 유지하면서 리사이징
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            resolve(file)
          }
        }, file.type, 0.8)
      }

      img.src = URL.createObjectURL(file)
    })
  }
}

export const fileUploadService = new FileUploadService()
